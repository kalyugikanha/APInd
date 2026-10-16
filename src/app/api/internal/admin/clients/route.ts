import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateApiKey, hashApiKey } from "@/lib/crypto";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const kyc = searchParams.get("kyc") || "";

    const where: any = {
      role: { in: ["CLIENT_ADMIN", "CLIENT_DEV"] },
    };

    if (status) {
      where.accountStatus = status;
    }

    if (kyc) {
      where.kycStatus = kyc;
    }

    if (search) {
      where.OR = [
        { companyName: { contains: search } },
        { brandName: { contains: search } },
        { fullName: { contains: search } },
        { email: { contains: search } },
        { clientCode: { contains: search } },
      ];
    }

    const clients = await db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        wallet: { select: { balance: true, currency: true } },
        apiKeys: { select: { id: true, type: true, isActive: true } },
        _count: { select: { apiLogs: true } },
      },
    });

    const formatted = clients.map((c) => ({
      id: c.id,
      clientCode: c.clientCode,
      companyName: c.companyName || "N/A",
      brandName: c.brandName,
      fullName: c.fullName,
      email: c.email,
      phone: c.phone,
      businessType: c.businessType,
      businessPan: c.businessPan,
      gstin: c.gstin,
      accountStatus: c.accountStatus,
      kycStatus: c.kycStatus,
      billingModel: c.billingModel,
      creditLimit: c.creditLimit,
      walletBalance: c.wallet?.balance || 0,
      activeKeysCount: c.apiKeys.filter((k) => k.isActive).length,
      totalHits: c._count.apiLogs,
      createdAt: c.createdAt,
    }));

    return NextResponse.json({ clients: formatted });
  } catch (err: any) {
    console.error("Error fetching clients:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * Super Admin Manual Client Registration Endpoint
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      companyName,
      brandName,
      fullName,
      email,
      phone,
      password,
      businessType,
      businessPan,
      gstin,
      address,
      city,
      state,
      pincode,
      billingModel = "PREPAID",
      creditLimit = 0,
      initialBalance = 0,
      allowedIps = [],
      lowBalanceAlert = 500,
    } = body;

    if (!email || !fullName || !companyName) {
      return NextResponse.json(
        { error: "Company name, full name, and email are required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if email already exists
    const existing = await db.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      return NextResponse.json(
        { error: "A client with this email already exists." },
        { status: 409 }
      );
    }

    // Generate guaranteed unique client code (e.g. CD-1002)
    let clientCode = "";
    for (let i = 0; i < 15; i++) {
      const candidate = `CD-${1000 + Math.floor(1000 + Math.random() * 9000)}`;
      const existingCode = await db.user.findUnique({ where: { clientCode: candidate } });
      if (!existingCode) {
        clientCode = candidate;
        break;
      }
    }
    if (!clientCode) {
      clientCode = `CD-${Date.now().toString().slice(-6)}`;
    }

    const prodKey = generateApiKey("PRODUCTION");
    const testKey = generateApiKey("SANDBOX");

    const client = await db.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          clientCode,
          email: cleanEmail,
          passwordHash: hashApiKey(password || "Colladome@123"),
          fullName,
          companyName,
          brandName: brandName || companyName,
          phone,
          role: "CLIENT_ADMIN",
          accountStatus: "ACTIVE",
          kycStatus: businessPan ? "VERIFIED" : "PENDING",
          billingModel,
          creditLimit: Number(creditLimit) || 0,
          businessType: businessType || "PVT_LTD",
          businessPan: businessPan ? businessPan.toUpperCase() : null,
          gstin: gstin ? gstin.toUpperCase() : null,
          address,
          city,
          state,
          pincode,
          wallet: {
            create: {
              balance: Number(initialBalance) || 0,
              currency: "INR",
            },
          },
          clientSettings: {
            create: {
              allowedIps: JSON.stringify(Array.isArray(allowedIps) && allowedIps.length > 0 ? allowedIps : ["*"]),
              sandboxIps: JSON.stringify(["127.0.0.1", "::1"]),
              lowBalanceAlert: Number(lowBalanceAlert) || 500,
              isLiveEnabled: true,
            },
          },
          apiKeys: {
            create: [
              {
                keyPrefix: prodKey.keyPrefix,
                keyHash: prodKey.keyHash,
                keyHint: prodKey.keyHint,
                type: "PRODUCTION",
                name: "Default Production Key",
                rateLimitRpm: 300,
                isActive: true,
              },
              {
                keyPrefix: testKey.keyPrefix,
                keyHash: testKey.keyHash,
                keyHint: testKey.keyHint,
                type: "SANDBOX",
                name: "Default Sandbox Key",
                rateLimitRpm: 60,
                isActive: true,
              },
            ],
          },
        },
        include: { wallet: true },
      });

      if (Number(initialBalance) > 0 && newUser.wallet) {
        await tx.walletTransaction.create({
          data: {
            walletId: newUser.wallet.id,
            amount: Number(initialBalance),
            type: "CREDIT",
            balanceBefore: 0.0,
            balanceAfter: Number(initialBalance),
            referenceId: "INITIAL_ONBOARDING_CREDIT",
            description: "Opening wallet balance credited upon onboarding",
          },
        });
      }

      return newUser;
    });

    return NextResponse.json({
      success: true,
      message: `Client ${companyName} (${clientCode}) onboarded successfully!`,
      client: {
        id: client.id,
        clientCode: client.clientCode,
        companyName: client.companyName,
        email: client.email,
        walletBalance: initialBalance,
        productionApiKey: prodKey.rawKey,
        sandboxApiKey: testKey.rawKey,
      },
    });
  } catch (err: any) {
    console.error("Error creating client:", err);
    return NextResponse.json({ error: err.message || "Failed to create client" }, { status: 500 });
  }
}
