import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const client = await db.user.findUnique({
      where: { id: params.id },
      include: {
        wallet: {
          include: {
            transactions: {
              take: 25,
              orderBy: { createdAt: "desc" },
            },
          },
        },
        clientSettings: true,
        apiKeys: {
          orderBy: { createdAt: "desc" },
        },
        documents: true,
        pricingRules: {
          include: {
            api: { select: { id: true, name: true, endpointPath: true, defaultSellPrice: true, defaultCostPrice: true } },
          },
        },
        apiLogs: {
          take: 20,
          orderBy: { createdAt: "desc" },
          include: {
            api: { select: { name: true, endpointPath: true } },
          },
        },
        panReports: {
          take: 10,
          orderBy: { createdAt: "desc" },
        },
        bankReports: {
          take: 10,
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            apiLogs: true,
            panReports: true,
            bankReports: true,
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Parse IP Whitelists
    let allowedIps: string[] = [];
    let sandboxIps: string[] = [];
    let allowedDomains: string[] = [];

    try {
      if (client.clientSettings?.allowedIps) allowedIps = JSON.parse(client.clientSettings.allowedIps);
      if (client.clientSettings?.sandboxIps) sandboxIps = JSON.parse(client.clientSettings.sandboxIps);
      if (client.clientSettings?.allowedDomains) allowedDomains = JSON.parse(client.clientSettings.allowedDomains);
    } catch {}

    // Fetch all available APIs so admin can see full pricing matrix
    const allApis = await db.api.findMany({
      where: { status: "ACTIVE" },
      include: { category: true },
      orderBy: { name: "asc" },
    });

    const pricingMatrix = allApis.map((api) => {
      const customRule = client.pricingRules.find((r) => r.apiId === api.id);
      return {
        apiId: api.id,
        apiName: api.name,
        category: api.category.name,
        endpointPath: api.endpointPath,
        defaultCostPrice: api.defaultCostPrice,
        defaultSellPrice: api.defaultSellPrice,
        defaultSetupFee: api.defaultSetupFee ?? 0,
        customPrice: customRule ? customRule.customPrice : api.defaultSellPrice,
        customSetupFee: customRule?.customSetupFee ?? null,
        effectiveSetupFee: customRule?.customSetupFee !== null && customRule?.customSetupFee !== undefined
          ? customRule.customSetupFee
          : (api.defaultSetupFee ?? 0),
        isSetupFeePaid: customRule ? customRule.isSetupFeePaid : false,
        setupFeePaidAt: customRule?.setupFeePaidAt || null,
        hasCustomPrice: !!customRule,
        isEnabled: customRule ? customRule.isEnabled : true,
      };
    });

    // Calculate Client Lifetime Financials
    const lifetimeRecharge = client.wallet?.transactions
      .filter((t) => t.type === "CREDIT")
      .reduce((acc, curr) => acc + curr.amount, 0) || 0;

    const lifetimeSpent = client.wallet?.transactions
      .filter((t) => t.type === "DEBIT")
      .reduce((acc, curr) => acc + curr.amount, 0) || 0;

    return NextResponse.json({
      client: {
        id: client.id,
        clientCode: client.clientCode,
        fullName: client.fullName,
        email: client.email,
        phone: client.phone,
        companyName: client.companyName,
        brandName: client.brandName,
        businessType: client.businessType,
        businessPan: client.businessPan,
        gstin: client.gstin,
        address: client.address,
        city: client.city,
        state: client.state,
        pincode: client.pincode,
        accountStatus: client.accountStatus,
        kycStatus: client.kycStatus,
        billingModel: client.billingModel,
        creditLimit: client.creditLimit,
        internalNotes: client.internalNotes,
        createdAt: client.createdAt,
        wallet: {
          id: client.wallet?.id,
          balance: client.wallet?.balance || 0,
          currency: client.wallet?.currency || "INR",
          lifetimeRecharge,
          lifetimeSpent,
          transactions: client.wallet?.transactions || [],
        },
        settings: {
          allowedIps,
          sandboxIps,
          allowedDomains,
          webhookUrl: client.clientSettings?.webhookUrl,
          webhookSecret: client.clientSettings?.webhookSecret,
          lowBalanceAlert: client.clientSettings?.lowBalanceAlert || 500,
          rateLimitRpm: client.clientSettings?.rateLimitRpm || 120,
          isLiveEnabled: client.clientSettings?.isLiveEnabled ?? true,
        },
        apiKeys: client.apiKeys,
        documents: client.documents,
        pricingMatrix,
        recentLogs: client.apiLogs,
        recentPanReports: client.panReports,
        recentBankReports: client.bankReports,
        stats: {
          totalHits: client._count.apiLogs,
          totalPanHits: client._count.panReports,
          totalBankHits: client._count.bankReports,
        },
      },
    });
  } catch (err: any) {
    console.error("Error fetching client 360 data:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const {
      companyName,
      brandName,
      fullName,
      phone,
      accountStatus,
      kycStatus,
      billingModel,
      creditLimit,
      internalNotes,
      businessPan,
      gstin,
    } = body;

    const updated = await db.user.update({
      where: { id: params.id },
      data: {
        ...(companyName !== undefined && { companyName }),
        ...(brandName !== undefined && { brandName }),
        ...(fullName !== undefined && { fullName }),
        ...(phone !== undefined && { phone }),
        ...(accountStatus !== undefined && { accountStatus }),
        ...(kycStatus !== undefined && { kycStatus }),
        ...(billingModel !== undefined && { billingModel }),
        ...(creditLimit !== undefined && { creditLimit: Number(creditLimit) }),
        ...(internalNotes !== undefined && { internalNotes }),
        ...(businessPan !== undefined && { businessPan: businessPan ? businessPan.toUpperCase() : null }),
        ...(gstin !== undefined && { gstin: gstin ? gstin.toUpperCase() : null }),
      },
    });

    return NextResponse.json({ success: true, client: updated });
  } catch (err: any) {
    console.error("Error updating client:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
