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
    if (!payload || payload.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden: Super Admin access required" }, { status: 403 });
    }

    const subscriptions = await db.apiSubscription.findMany({
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            companyName: true,
            email: true,
            phone: true,
          },
        },
        api: {
          select: {
            id: true,
            name: true,
            endpointPath: true,
            defaultSellPrice: true,
            defaultCostPrice: true,
            category: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ subscriptions });
  } catch (err: any) {
    console.error("Admin subscriptions fetch error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifySessionToken(token);
    if (!payload || payload.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden: Super Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { subscriptionId, action, adminRemarks } = body;

    if (!subscriptionId || !action) {
      return NextResponse.json(
        { error: "subscriptionId and action ('APPROVE' | 'REJECT') are required." },
        { status: 400 }
      );
    }

    const subscription = await db.apiSubscription.findUnique({
      where: { id: subscriptionId },
      include: { user: true, api: true },
    });

    if (!subscription) {
      return NextResponse.json({ error: "Subscription record not found" }, { status: 404 });
    }

    if (action === "APPROVE") {
      const updated = await db.$transaction(async (tx) => {
        // 1. Mark subscription approved
        const sub = await tx.apiSubscription.update({
          where: { id: subscriptionId },
          data: {
            status: "APPROVED",
            adminRemarks: adminRemarks || "Verified and approved by Super Admin",
            reviewedBy: payload.email || "admin@colladome.com",
            reviewedAt: new Date(),
          },
        });

        // 2. Upsert client pricing to mark setup fee paid and API enabled
        await tx.clientPricing.upsert({
          where: {
            userId_apiId: {
              userId: subscription.userId,
              apiId: subscription.apiId,
            },
          },
          update: {
            isSetupFeePaid: true,
            setupFeePaidAt: new Date(),
            isEnabled: true,
          },
          create: {
            userId: subscription.userId,
            apiId: subscription.apiId,
            customPrice: subscription.api.defaultSellPrice,
            isSetupFeePaid: true,
            setupFeePaidAt: new Date(),
            isEnabled: true,
          },
        });

        return sub;
      });

      return NextResponse.json({
        success: true,
        message: `Subscription for '${subscription.api.name}' approved! API is now active for ${subscription.user.companyName || subscription.user.fullName}.`,
        subscription: updated,
      });
    } else if (action === "REJECT") {
      const updated = await db.apiSubscription.update({
        where: { id: subscriptionId },
        data: {
          status: "REJECTED",
          adminRemarks: adminRemarks || "Payment verification rejected by admin.",
          reviewedBy: payload.email || "admin@colladome.com",
          reviewedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: `Subscription request rejected. Client can view remarks and resubmit.`,
        subscription: updated,
      });
    } else {
      return NextResponse.json({ error: "Invalid action. Must be 'APPROVE' or 'REJECT'." }, { status: 400 });
    }
  } catch (err: any) {
    console.error("Admin subscription PATCH error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
