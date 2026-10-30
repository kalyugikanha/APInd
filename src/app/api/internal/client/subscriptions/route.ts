import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifySessionToken(token);
    if (!payload?.userId) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const subscriptions = await db.apiSubscription.findMany({
      where: { userId: payload.userId },
      include: {
        api: {
          select: {
            id: true,
            name: true,
            endpointPath: true,
            defaultSellPrice: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ subscriptions });
  } catch (err: any) {
    console.error("Client subscriptions fetch error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized: Please log in." }, { status: 401 });
    }

    const payload = verifySessionToken(token);
    if (!payload?.userId) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const body = await req.json();
    const {
      apiId,
      utrNumber,
      paymentMethod = "IMPS",
      setupFee = 5500.0,
      gstAmount = 990.0,
      totalAmount = 6490.0,
      receiptUrl,
      receiptName,
      remarks,
    } = body;

    if (!apiId || !utrNumber) {
      return NextResponse.json(
        { error: "API ID and Transaction UTR Number are required." },
        { status: 400 }
      );
    }

    const api = await db.api.findUnique({ where: { id: apiId } });
    if (!api) {
      return NextResponse.json({ error: "API not found" }, { status: 404 });
    }

    // Check if there is already an active or pending subscription for this user & api
    const existingActive = await db.clientPricing.findUnique({
      where: {
        userId_apiId: {
          userId: payload.userId,
          apiId,
        },
      },
    });

    if (existingActive?.isSetupFeePaid) {
      return NextResponse.json(
        { error: "You are already subscribed to this API." },
        { status: 400 }
      );
    }

    const existingPending = await db.apiSubscription.findFirst({
      where: {
        userId: payload.userId,
        apiId,
        status: "PENDING",
      },
    });

    if (existingPending) {
      return NextResponse.json(
        {
          error: "You already have a pending subscription verification for this API. Please wait for Admin review.",
        },
        { status: 400 }
      );
    }

    const subscription = await db.apiSubscription.create({
      data: {
        userId: payload.userId,
        apiId,
        setupFee: Number(setupFee),
        gstAmount: Number(gstAmount),
        totalAmount: Number(totalAmount),
        utrNumber: String(utrNumber).trim(),
        paymentMethod,
        receiptUrl: receiptUrl || null,
        receiptName: receiptName || null,
        status: "PENDING",
        adminRemarks: remarks || null,
      },
      include: {
        api: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Subscription payment proof submitted successfully. Admin will verify and activate your API within 1–2 hours.",
      subscription,
    });
  } catch (err: any) {
    console.error("Subscription create error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
