import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/session";

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
    const { amount, paymentMethod = "UPI" } = body;

    const netAmount = Number(amount);
    if (!netAmount || netAmount < 100) {
      return NextResponse.json(
        { error: "Minimum recharge amount is ₹100.00" },
        { status: 400 }
      );
    }

    if (netAmount > 500000) {
      return NextResponse.json(
        { error: "Maximum single transaction limit is ₹5,00,000.00" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });

    if (!user || !user.wallet) {
      return NextResponse.json({ error: "Client wallet not found" }, { status: 404 });
    }

    // 18% GST calculation (standard for software/API services in India)
    const gstRate = 0.18;
    const gstAmount = Number((netAmount * gstRate).toFixed(2));
    const totalPayable = Number((netAmount + gstAmount).toFixed(2));

    const internalOrderId = `CD_ORD_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

    const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    let razorpayOrderId = `order_${Date.now()}`;
    let mode: "LIVE_RAZORPAY" | "INSTANT_SIMULATION" = "INSTANT_SIMULATION";

    // If real Razorpay credentials are present in env, create real order on Razorpay API
    if (razorpayKeyId && razorpayKeySecret) {
      try {
        const authHeader = `Basic ${Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString("base64")}`;
        const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
          },
          body: JSON.stringify({
            amount: Math.round(totalPayable * 100), // Razorpay expects amount in paise
            currency: "INR",
            receipt: internalOrderId,
            notes: {
              userId: user.id,
              clientCode: user.clientCode,
              netCredit: netAmount,
            },
          }),
        });

        if (rzpRes.ok) {
          const rzpData = await rzpRes.json();
          razorpayOrderId = rzpData.id;
          mode = "LIVE_RAZORPAY";
        }
      } catch (err) {
        console.warn("Razorpay API call failed, falling back to simulated checkout:", err);
      }
    }

    return NextResponse.json({
      success: true,
      orderId: internalOrderId,
      razorpayOrderId,
      mode,
      amount: netAmount,
      gstAmount,
      totalPayable,
      currency: "INR",
      razorpayKeyId: razorpayKeyId || "rzp_test_colladome_demo",
      client: {
        name: user.companyName || user.fullName,
        email: user.email,
        phone: user.phone || "+919876543210",
        clientCode: user.clientCode,
      },
    });
  } catch (err: any) {
    console.error("Payment checkout error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
