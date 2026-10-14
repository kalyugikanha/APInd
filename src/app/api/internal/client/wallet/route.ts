import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId");

    const user = clientId
      ? await db.user.findUnique({ where: { id: clientId }, include: { wallet: true } })
      : await db.user.findFirst({ where: { email: "fintech@acme.com" }, include: { wallet: true } });

    if (!user || !user.wallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    const transactions = await db.walletTransaction.findMany({
      where: { walletId: user.wallet.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      balance: user.wallet.balance,
      currency: user.wallet.currency,
      transactions,
    });
  } catch (err: any) {
    console.error("Wallet fetch error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clientId, amount, paymentMethod = "UPI" } = body;

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return NextResponse.json({ error: "Please enter a valid amount." }, { status: 400 });
    }

    const user = clientId
      ? await db.user.findUnique({ where: { id: clientId }, include: { wallet: true } })
      : await db.user.findFirst({ where: { email: "fintech@acme.com" }, include: { wallet: true } });

    if (!user || !user.wallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    const ref = `PG_PAY_${Date.now()}`;
    const balanceBefore = user.wallet.balance;
    const balanceAfter = Number((balanceBefore + numAmount).toFixed(2));

    await db.$transaction([
      db.wallet.update({
        where: { id: user.wallet.id },
        data: { balance: balanceAfter },
      }),
      db.walletTransaction.create({
        data: {
          walletId: user.wallet.id,
          amount: numAmount,
          type: "CREDIT",
          balanceBefore,
          balanceAfter,
          referenceId: ref,
          description: `Online Wallet Recharge via ${paymentMethod}`,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: `Wallet recharged successfully with ₹${numAmount.toLocaleString()}!`,
      newBalance: balanceAfter,
    });
  } catch (err: any) {
    console.error("Recharge error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
