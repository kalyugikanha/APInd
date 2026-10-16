import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/session";
import crypto from "crypto";

export const dynamic = "force-dynamic";

function getUserId(req: NextRequest): string | null {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = verifySessionToken(token);
  return payload ? payload.userId : null;
}

export async function POST(req: NextRequest) {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized: Active session required" }, { status: 401 });
    }

    const body = await req.json();
    const {
      orderId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      amount,
      paymentMethod = "UPI",
    } = body;

    const netAmount = Number(amount);
    if (!netAmount || netAmount <= 0) {
      return NextResponse.json({ error: "Invalid recharge amount." }, { status: 400 });
    }

    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    // Verify signature if live Razorpay credentials are used
    if (razorpayKeySecret && razorpayOrderId && razorpayPaymentId && razorpaySignature) {
      const hmac = crypto.createHmac("sha256", razorpayKeySecret);
      hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`);
      const generatedSignature = hmac.digest("hex");

      if (generatedSignature !== razorpaySignature) {
        return NextResponse.json(
          { error: "Payment verification failed: Invalid cryptographic signature." },
          { status: 400 }
        );
      }
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });

    if (!user || !user.wallet) {
      return NextResponse.json({ error: "Client wallet not found." }, { status: 404 });
    }

    // Check for duplicate payment transaction
    const paymentId = razorpayPaymentId || `PAY_SIM_${Date.now()}`;
    const existingTx = await db.walletTransaction.findFirst({
      where: { referenceId: paymentId },
    });

    if (existingTx) {
      return NextResponse.json(
        { error: "Payment reference has already been credited." },
        { status: 409 }
      );
    }

    const gstAmount = Number((netAmount * 0.18).toFixed(2));
    const totalPaid = Number((netAmount + gstAmount).toFixed(2));
    const invoiceNumber = `CD-INV-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;

    const metadata = {
      gateway: razorpayKeySecret ? "RAZORPAY" : "INSTANT_UPI",
      paymentId,
      orderId: orderId || razorpayOrderId || `ORD_${Date.now()}`,
      invoiceNumber,
      netAmount,
      gstRate: 18,
      gstAmount,
      totalPaid,
      paymentMethod,
      clientName: user.companyName || user.fullName,
      clientEmail: user.email,
      clientCode: user.clientCode,
      paidAt: new Date().toISOString(),
    };

    const balanceBefore = user.wallet.balance ?? 0;
    const balanceAfter = Number((balanceBefore + netAmount).toFixed(2));

    const [updatedWallet, transaction] = await db.$transaction([
      db.wallet.update({
        where: { id: user.wallet.id },
        data: { balance: balanceAfter },
      }),
      db.walletTransaction.create({
        data: {
          walletId: user.wallet.id,
          amount: netAmount,
          type: "CREDIT",
          balanceBefore,
          balanceAfter,
          referenceId: paymentId,
          description: `Online Wallet Recharge via ${paymentMethod} (Inv: ${invoiceNumber})`,
          metadata: JSON.stringify(metadata),
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: `₹${netAmount.toFixed(2)} credited to your wallet successfully!`,
      walletBalance: updatedWallet.balance,
      transactionId: transaction.id,
      invoiceNumber,
      metadata,
    });
  } catch (err: any) {
    console.error("Payment verification error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
