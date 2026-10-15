import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/session";

export const dynamic = "force-dynamic";

function resolveTargetUser(req: NextRequest, explicitClientId?: string | null) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    const payload = verifySessionToken(token);
    if (payload) {
      if (payload.role === "SUPER_ADMIN" && explicitClientId) {
        return explicitClientId;
      }
      return payload.userId;
    }
  }
  return explicitClientId || null;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clientIdParam = searchParams.get("clientId");
    const userId = resolveTargetUser(req, clientIdParam);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized: Active session required" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });

    if (!user || !user.wallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    const transactions = await db.walletTransaction.findMany({
      where: { walletId: user.wallet.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      balance: user.wallet.balance ?? 0,
      currency: user.wallet.currency || "INR",
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

    const userId = resolveTargetUser(req, clientId);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized: Active session required" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });

    if (!user || !user.wallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    const ref = `PG_PAY_${Date.now()}`;
    const balanceBefore = user.wallet.balance ?? 0;
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
