import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clientIdParam = searchParams.get("clientId");

    // In production, clientId comes from auth session/cookie. Default to Acme Fintech for preview/demo
    let user = null;
    if (clientIdParam) {
      user = await db.user.findUnique({
        where: { id: clientIdParam },
        include: {
          wallet: true,
          apiKeys: { orderBy: { createdAt: "desc" } },
          clientSettings: true,
          _count: { select: { apiLogs: true, panReports: true, bankReports: true } },
        },
      });
    } else {
      user = await db.user.findFirst({
        where: { email: "fintech@acme.com" },
        include: {
          wallet: true,
          apiKeys: { orderBy: { createdAt: "desc" } },
          clientSettings: true,
          _count: { select: { apiLogs: true, panReports: true, bankReports: true } },
        },
      });
    }

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
        clientCode: user.clientCode,
        fullName: user.fullName,
        email: user.email,
        companyName: user.companyName,
        brandName: user.brandName,
        phone: user.phone,
        billingModel: user.billingModel,
        accountStatus: user.accountStatus,
        kycStatus: user.kycStatus,
        wallet: {
          id: user.wallet?.id,
          balance: user.wallet?.balance || 0,
          currency: user.wallet?.currency || "INR",
        },
        settings: {
          allowedIps,
          webhookUrl: user.clientSettings?.webhookUrl,
          lowBalanceAlert: user.clientSettings?.lowBalanceAlert || 500,
        },
        apiKeys: user.apiKeys,
        stats: {
          totalHits: user._count.apiLogs,
          totalPanHits: user._count.panReports,
          totalBankHits: user._count.bankReports,
        },
      },
    });
  } catch (err: any) {
    console.error("Client profile error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
