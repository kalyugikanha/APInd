import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateApiKey, hashApiKey } from "@/lib/crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { companyName, contactPerson, email, phone } = body;

    if (!email || !contactPerson) {
      return NextResponse.json(
        { error: "Email and contact person name are required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user already exists
    let user = await db.user.findUnique({
      where: { email: cleanEmail },
      include: { wallet: true, apiKeys: true },
    });

    let rawKey = "";
    let keyHint = "";

    if (!user) {
      const clientCount = await db.user.count();
      const clientCode = `CD-${1000 + clientCount + 1}`;
      const generated = generateApiKey("SANDBOX");
      rawKey = generated.rawKey;
      keyHint = generated.keyHint;

      user = await db.user.create({
        data: {
          clientCode,
          email: cleanEmail,
          passwordHash: hashApiKey("Sandbox@123"),
          fullName: contactPerson,
          companyName: companyName || `${contactPerson}'s Team`,
          phone: phone || null,
          role: "CLIENT_DEV",
          accountStatus: "ACTIVE",
          kycStatus: "NOT_SUBMITTED",
          billingModel: "PREPAID",
          wallet: {
            create: {
              balance: 100.0, // Pre-loaded trial credits
              currency: "INR",
            },
          },
          clientSettings: {
            create: {
              allowedIps: JSON.stringify(["*"]),
              sandboxIps: JSON.stringify(["*"]),
              isLiveEnabled: false,
            },
          },
          apiKeys: {
            create: {
              keyPrefix: generated.keyPrefix,
              keyHash: generated.keyHash,
              keyHint: generated.keyHint,
              type: "SANDBOX",
              name: "Instant Trial Sandbox Key",
              rateLimitRpm: 60,
              isActive: true,
            },
          },
        },
        include: { wallet: true, apiKeys: true },
      });

      // Record welcome trial bonus transaction
      if (user.wallet) {
        await db.walletTransaction.create({
          data: {
            walletId: user.wallet.id,
            amount: 100.0,
            type: "CREDIT",
            balanceBefore: 0.0,
            balanceAfter: 100.0,
            referenceId: "WELCOME_SANDBOX_BONUS",
            description: "Instant developer sandbox trial bonus",
          },
        });
      }
    } else {
      // User exists, find or create sandbox key
      const existingKey = user.apiKeys.find((k) => k.type === "SANDBOX" && k.isActive);
      if (existingKey) {
        keyHint = existingKey.keyHint;
        rawKey = `(Existing Sandbox Key ending in ${existingKey.keyHint})`;
      } else {
        const generated = generateApiKey("SANDBOX");
        rawKey = generated.rawKey;
        keyHint = generated.keyHint;
        await db.apiKey.create({
          data: {
            userId: user.id,
            keyPrefix: generated.keyPrefix,
            keyHash: generated.keyHash,
            keyHint: generated.keyHint,
            type: "SANDBOX",
            name: "New Sandbox Key",
            rateLimitRpm: 60,
            isActive: true,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Instant Sandbox API Key generated successfully!",
      apiKey: rawKey,
      keyHint,
      clientCode: user.clientCode,
      trialBalance: user.wallet?.balance || 100.0,
      sampleCurl: `curl -X POST "http://localhost:3000/api/v1/verification/pan" \\\n  -H "x-api-key: ${rawKey}" \\\n  -H "x-client-order-id: TEST_ORDER_001" \\\n  -H "Content-Type: application/json" \\\n  -d '{"pan_number": "ABCDE1234F", "consent": "Y"}'`,
    });
  } catch (err: any) {
    console.error("Error creating sandbox key:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate sandbox key" },
      { status: 500 }
    );
  }
}
