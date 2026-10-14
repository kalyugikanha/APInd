import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adjustClientWallet } from "@/lib/gateway/wallet";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { amount, type, description, referenceId } = body;

    if (!amount || amount <= 0 || !type || !description) {
      return NextResponse.json(
        { error: "Amount, type (CREDIT/DEBIT), and description are required." },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: params.id },
      include: { wallet: true },
    });

    if (!user || !user.wallet) {
      return NextResponse.json({ error: "Client wallet not found." }, { status: 404 });
    }

    const ref = referenceId || `MANUAL_${Date.now()}`;
    const result = await adjustClientWallet(
      user.wallet.id,
      Number(amount),
      type as "CREDIT" | "DEBIT",
      description,
      ref
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully ${type === "CREDIT" ? "credited" : "debited"} ₹${amount} to client wallet.`,
      newBalance: result.newBalance,
    });
  } catch (err: any) {
    console.error("Wallet adjustment error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
