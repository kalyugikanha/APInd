import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clientIdParam = searchParams.get("clientId");

    // Resolve user ID from session cookie or query param (for Super Admin inspection)
    let targetUserId: string | null = null;
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (token) {
      const payload = verifySessionToken(token);
      if (payload) {
        if (payload.role === "SUPER_ADMIN" && clientIdParam) {
          targetUserId = clientIdParam;
        } else {
          targetUserId = payload.userId;
        }
      }
    } else if (clientIdParam) {
      targetUserId = clientIdParam;
    }

    if (!targetUserId) {
      return NextResponse.json(
        { error: "Unauthorized: Active session required" },
        { status: 401 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: targetUserId },
      include: {
        wallet: true,
        apiKeys: { orderBy: { createdAt: "desc" } },
        clientSettings: true,
        _count: { select: { apiLogs: true, panReports: true, bankReports: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    let allowedIps: string[] = [];
    try {
      if (user.clientSettings?.allowedIps) allowedIps = JSON.parse(user.clientSettings.allowedIps);
    } catch {}

    return NextResponse.json({
      client: {
        id: user.id,
        clientCode: user.clientCode || "N/A",
        fullName: user.fullName,
        email: user.email,
        companyName: user.companyName || user.fullName,
        brandName: user.brandName,
        phone: user.phone,
        billingModel: user.billingModel,
        accountStatus: user.accountStatus,
        kycStatus: user.kycStatus,
        wallet: {
          id: user.wallet?.id,
          balance: user.wallet?.balance ?? 0,
          currency: user.wallet?.currency || "INR",
        },
        settings: {
          allowedIps,
          webhookUrl: user.clientSettings?.webhookUrl,
          lowBalanceAlert: user.clientSettings?.lowBalanceAlert || 500,
        },
        apiKeys: user.apiKeys,
        stats: {
          totalHits: user._count.apiLogs ?? 0,
          totalPanHits: user._count.panReports ?? 0,
          totalBankHits: user._count.bankReports ?? 0,
        },
      },
    });
  } catch (err: any) {
    console.error("Client profile error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
