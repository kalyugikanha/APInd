import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

function hashApiKey(apiKey: string): string {
  return crypto.createHash("sha256").update(apiKey).digest("hex");
}

function encrypt(text: string): string {
  const secret = process.env.ENCRYPTION_SECRET || "colladome_super_secure_aes_256_key_32bytes!";
  const key = crypto.createHash("sha256").update(secret).digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted}`;
}

async function main() {
  console.log("Seeding Colladome platform database...");

  // Check if already seeded to protect production data
  const existingAdmin = await prisma.user.findUnique({
    where: { email: "admin@colladome.com" },
  });

  if (existingAdmin) {
    console.log("ℹ️  Database already initialized with Super Admin (admin@colladome.com). Skipping seed wipe.");
    return;
  }

  // Clean old data for fresh seed
  await prisma.bankReport.deleteMany();
  await prisma.panReport.deleteMany();
  await prisma.apiLog.deleteMany();
  await prisma.walletTransaction.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.clientPricing.deleteMany();
  await prisma.apiProviderMapping.deleteMany();
  await prisma.api.deleteMany();
  await prisma.apiCategory.deleteMany();
  await prisma.provider.deleteMany();
  await prisma.clientDocument.deleteMany();
  await prisma.clientSetting.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.user.deleteMany();

  // 1. Super Admin
  const admin = await prisma.user.create({
    data: {
      email: "admin@colladome.com",
      passwordHash: hashApiKey("Admin@123"),
      fullName: "Super Administrator",
      phone: "+91 98765 43210",
      role: "SUPER_ADMIN",
      accountStatus: "ACTIVE",
      kycStatus: "VERIFIED",
      billingModel: "POSTPAID",
      companyName: "Colladome Tech Private Limited",
      brandName: "Colladome",
      businessType: "PVT_LTD",
      businessPan: "AABCC1234F",
      gstin: "27AABCC1234F1Z8",
      address: "Tower 4, World Tech Park",
      city: "Gurugram",
      state: "Haryana",
      pincode: "122002",
      wallet: {
        create: {
          balance: 1000000.0,
          currency: "INR",
        },
      },
      clientSettings: {
        create: {
          allowedIps: JSON.stringify(["127.0.0.1", "::1"]),
          sandboxIps: JSON.stringify(["127.0.0.1", "::1"]),
          allowedDomains: JSON.stringify(["colladome.com", "api.colladome.com"]),
          rateLimitRpm: 5000,
          isLiveEnabled: true,
        },
      },
    },
  });
  console.log(`Created Super Admin: ${admin.email}`);

  // 2. Active Enterprise Client (Acme Fintech Solutions)
  const clientAcme = await prisma.user.create({
    data: {
      clientCode: "CD-1001",
      email: "fintech@acme.com",
      passwordHash: hashApiKey("Acme@123"),
      fullName: "Vikram Malhotra",
      phone: "+91 99887 76655",
      role: "CLIENT_ADMIN",
      accountStatus: "ACTIVE",
      kycStatus: "VERIFIED",
      billingModel: "PREPAID",
      creditLimit: 0,
      companyName: "Acme Fintech Solutions Pvt Ltd",
      brandName: "Acme Pay",
      businessType: "PVT_LTD",
      businessPan: "AAACA5678B",
      gstin: "27AAACA5678B1Z2",
      address: "9th Floor, Cyber Towers, Hitec City",
      city: "Hyderabad",
      state: "Telangana",
      pincode: "500081",
      wallet: {
        create: {
          balance: 45200.0,
          currency: "INR",
        },
      },
      clientSettings: {
        create: {
          allowedIps: JSON.stringify(["127.0.0.1", "::1", "103.21.244.15", "103.21.244.16"]),
          sandboxIps: JSON.stringify(["127.0.0.1", "::1"]),
          allowedDomains: JSON.stringify(["acmepay.in", "app.acmepay.in"]),
          webhookUrl: "https://acmepay.in/api/v1/webhooks/colladome",
          webhookSecret: "whsec_acme_78941238479182374",
          lowBalanceAlert: 1000.0,
          rateLimitRpm: 300,
          isLiveEnabled: true,
        },
      },
    },
    include: { wallet: true },
  });

  // Client API Keys
  const liveRawKey = "cd_live_acme_prod_secret_88319a2b";
  const testRawKey = "cd_test_acme_sand_secret_11928c3d";
  await prisma.apiKey.createMany({
    data: [
      {
        userId: clientAcme.id,
        keyPrefix: "cd_live_",
        keyHash: hashApiKey(liveRawKey),
        keyHint: "...88319a2b",
        type: "PRODUCTION",
        name: "Acme Production Key",
        rateLimitRpm: 300,
        isActive: true,
      },
      {
        userId: clientAcme.id,
        keyPrefix: "cd_test_",
        keyHash: hashApiKey(testRawKey),
        keyHint: "...11928c3d",
        type: "SANDBOX",
        name: "Acme Sandbox Test Key",
        rateLimitRpm: 60,
        isActive: true,
      },
    ],
  });

  // Client Initial Wallet Transaction
  if (clientAcme.wallet) {
    await prisma.walletTransaction.create({
      data: {
        walletId: clientAcme.wallet.id,
        amount: 50000.0,
        type: "CREDIT",
        balanceBefore: 0.0,
        balanceAfter: 50000.0,
        referenceId: "NEFT_HDFC_99182348",
        description: "Initial wallet recharge via Bank NEFT",
        adminUserId: admin.id,
      },
    });
  }

  // 3. Pending Approval Client (QuickLoan Tech)
  const pendingClient = await prisma.user.create({
    data: {
      clientCode: "CD-1002",
      email: "contact@quickloan.in",
      passwordHash: hashApiKey("QuickLoan@123"),
      fullName: "Rohit Verma",
      phone: "+91 91234 56789",
      role: "CLIENT_ADMIN",
      accountStatus: "UNDER_REVIEW",
      kycStatus: "PENDING",
      billingModel: "PREPAID",
      companyName: "QuickLoan Technologies Pvt Ltd",
      brandName: "QuickLoan",
      businessType: "PVT_LTD",
      businessPan: "AABFQ9876C",
      gstin: "07AABFQ9876C1ZD",
      address: "Connaught Place, Barakhamba Road",
      city: "New Delhi",
      state: "Delhi",
      pincode: "110001",
      wallet: {
        create: {
          balance: 0.0,
          currency: "INR",
        },
      },
      clientSettings: {
        create: {
          allowedIps: JSON.stringify([]),
          lowBalanceAlert: 500.0,
          isLiveEnabled: false,
        },
      },
      documents: {
        create: [
          {
            docType: "PAN_CARD",
            fileName: "QuickLoan_PAN_Card.pdf",
            fileUrl: "/docs/pan_sample.pdf",
            status: "PENDING",
          },
          {
            docType: "GSTIN_CERTIFICATE",
            fileName: "QuickLoan_GST_Certificate.pdf",
            fileUrl: "/docs/gst_sample.pdf",
            status: "PENDING",
          },
        ],
      },
    },
  });
  console.log(`Created Pending Client: ${pendingClient.email}`);

  // 4. Categories
  const catIdentity = await prisma.apiCategory.create({
    data: {
      name: "Identity Verification",
      slug: "identity-verification",
      description: "Verify Indian identity documents including PAN, Aadhaar, Voter ID, and Driving License.",
      icon: "ShieldCheck",
      sortOrder: 1,
    },
  });

  const catBanking = await prisma.apiCategory.create({
    data: {
      name: "Banking & Financials",
      slug: "banking-financials",
      description: "Instant penny drop bank account verification, IFSC lookups, and UPI VPA validation.",
      icon: "Building2",
      sortOrder: 2,
    },
  });

  const catBusiness = await prisma.apiCategory.create({
    data: {
      name: "Business & Tax",
      slug: "business-tax",
      description: "Corporate verification suite: GSTIN search, MCA/ROC company info, and Director DIN checks.",
      icon: "FileCheck",
      sortOrder: 3,
    },
  });

  // 5. Providers (Zoop, IDFY, Decentro, Surpass)
  const provZoop = await prisma.provider.create({
    data: {
      name: "Zoop.one",
      code: "ZOOP",
      baseUrl: "https://api.zoop.one",
      authType: "HEADER_API_KEY",
      credentialsEnc: encrypt(JSON.stringify({ apiKey: "zoop_live_sec_key_sample", appId: "zoop_app_01" })),
      isActive: true,
    },
  });

  const provIdfy = await prisma.provider.create({
    data: {
      name: "IDFY (Baldor)",
      code: "IDFY",
      baseUrl: "https://api.idfy.com",
      authType: "BEARER_TOKEN",
      credentialsEnc: encrypt(JSON.stringify({ apiKey: "idfy_sec_bearer_sample" })),
      isActive: true,
    },
  });

  const provDecentro = await prisma.provider.create({
    data: {
      name: "Decentro Tech",
      code: "DECENTRO",
      baseUrl: "https://api.decentro.tech",
      authType: "HEADER_API_KEY",
      credentialsEnc: encrypt(JSON.stringify({ clientId: "dec_client_99", clientSecret: "dec_sec_88" })),
      isActive: true,
    },
  });

  const provSurpass = await prisma.provider.create({
    data: {
      name: "Surpass Data",
      code: "SURPASS",
      baseUrl: "https://api.surpass.in",
      authType: "HEADER_API_KEY",
      credentialsEnc: encrypt(JSON.stringify({ apiKey: "surpass_token_99182" })),
      isActive: true,
    },
  });

  // 6. APIs
  // API 1: PAN Verification
  const apiPan = await prisma.api.create({
    data: {
      categoryId: catIdentity.id,
      name: "PAN Detailed Verification",
      slug: "pan-verification",
      endpointPath: "/v1/verification/pan",
      httpMethod: "POST",
      description: "Instantly verifies any Indian Permanent Account Number (PAN) with Income Tax Department records. Returns taxpayer name, category, status, and Aadhaar linking status.",
      useCase: "KYC onboarding for fintechs, lending apps, stock brokers, and neo-banks.",
      status: "ACTIVE",
      defaultCostPrice: 1.80,
      defaultSellPrice: 2.50,
      requestSchema: JSON.stringify({
        pan_number: { type: "string", required: true, example: "ABCDE1234F", description: "10-character alphanumeric PAN" },
        consent: { type: "string", required: true, example: "Y", description: "User consent (Y/N)" },
      }),
      responseSchema: JSON.stringify({
        pan_number: "ABCDE1234F",
        full_name: "VIKRAM MALHOTRA",
        category: "INDIVIDUAL",
        status: "VALID",
        pan_aadhaar_linked: true,
      }),
      providerMappings: {
        create: [
          {
            providerId: provZoop.id,
            providerEndpoint: "/api/v1/in/identity/pan/advance",
            providerMethod: "POST",
            priority: 1, // Primary
            requestTransform: JSON.stringify({ customer_pan_number: "pan_number", consent: "consent" }),
            responseExtract: JSON.stringify({ name: "result.user_full_name", status: "result.pan_status" }),
          },
          {
            providerId: provIdfy.id,
            providerEndpoint: "/v3/tasks/async/verify_with_source/ind_pan",
            providerMethod: "POST",
            priority: 2, // Secondary Fallback
            requestTransform: JSON.stringify({ id_number: "pan_number" }),
          },
        ],
      },
    },
  });

  // Custom Pricing for Acme (special volume price ₹2.10 instead of standard ₹2.50)
  await prisma.clientPricing.create({
    data: {
      userId: clientAcme.id,
      apiId: apiPan.id,
      customPrice: 2.10,
      isEnabled: true,
    },
  });

  // API 2: Bank Penny Drop Verification
  const apiBank = await prisma.api.create({
    data: {
      categoryId: catBanking.id,
      name: "Bank Account Penny Drop Verification",
      slug: "bank-account-verify",
      endpointPath: "/v1/banking/bank-verify",
      httpMethod: "POST",
      description: "Verifies Indian bank account holder name and validity via real-time ₹1 IMPS penny-drop. Returns beneficiary name registered with the bank, UTR number, and name match score.",
      useCase: "Payout verification, employee payroll, merchant payouts, and loan disbursements.",
      status: "ACTIVE",
      defaultCostPrice: 2.20,
      defaultSellPrice: 3.50,
      requestSchema: JSON.stringify({
        account_number: { type: "string", required: true, example: "001201509823", description: "Bank Account Number" },
        ifsc_code: { type: "string", required: true, example: "HDFC0000012", description: "11-character bank IFSC code" },
        beneficiary_name: { type: "string", required: false, example: "Vikram Malhotra", description: "Expected name for match scoring" },
      }),
      responseSchema: JSON.stringify({
        account_number: "001201509823",
        ifsc_code: "HDFC0000012",
        bank_name: "HDFC BANK",
        name_at_bank: "VIKRAM MALHOTRA",
        name_match_score: 98.5,
        utr_number: "2026101499812481",
        status: "VERIFIED",
      }),
      providerMappings: {
        create: [
          {
            providerId: provDecentro.id,
            providerEndpoint: "/core_banking/money_transfer/penny_drop",
            providerMethod: "POST",
            priority: 1,
          },
          {
            providerId: provIdfy.id,
            providerEndpoint: "/v3/tasks/sync/verify_with_source/ind_bank_account",
            providerMethod: "POST",
            priority: 2,
          },
        ],
      },
    },
  });

  // API 3: Aadhaar OKYC
  const apiAadhaar = await prisma.api.create({
    data: {
      categoryId: catIdentity.id,
      name: "Aadhaar Paperless OKYC (OTP Based)",
      slug: "aadhaar-okyc",
      endpointPath: "/v1/verification/aadhaar-okyc",
      httpMethod: "POST",
      description: "Generates and validates Aadhaar OTP directly with UIDAI to fetch verified name, gender, DOB, address, and live photo with citizen consent.",
      useCase: "Full KYC for digital onboarding, telecom SIM issuance, and demat accounts.",
      status: "ACTIVE",
      defaultCostPrice: 1.20,
      defaultSellPrice: 1.80,
      requestSchema: JSON.stringify({
        aadhaar_number: { type: "string", required: true, example: "XXXXXXXX1234" },
      }),
      responseSchema: JSON.stringify({
        status: "OTP_SENT",
        reference_id: "UIDAI_REF_892314",
      }),
      providerMappings: {
        create: [
          {
            providerId: provZoop.id,
            providerEndpoint: "/api/v1/in/identity/okyc/otp/request",
            providerMethod: "POST",
            priority: 1,
          },
        ],
      },
    },
  });

  // API 4: GSTIN Verification
  const apiGstin = await prisma.api.create({
    data: {
      categoryId: catBusiness.id,
      name: "GSTIN Verification & Tax Profile",
      slug: "gstin-verification",
      endpointPath: "/v1/business/gstin-verify",
      httpMethod: "POST",
      description: "Validates GST Identification Number (GSTIN) directly from GST portal. Returns legal business name, trade name, taxpayer type, filing status, and principal place of business.",
      useCase: "B2B vendor onboarding, merchant verification, and invoice financing.",
      status: "ACTIVE",
      defaultCostPrice: 1.50,
      defaultSellPrice: 2.20,
      requestSchema: JSON.stringify({
        gstin: { type: "string", required: true, example: "27AAACA5678B1Z2" },
      }),
      responseSchema: JSON.stringify({
        gstin: "27AAACA5678B1Z2",
        legal_name: "ACME FINTECH SOLUTIONS PRIVATE LIMITED",
        trade_name: "ACME PAY",
        status: "ACTIVE",
      }),
      providerMappings: {
        create: [
          {
            providerId: provSurpass.id,
            providerEndpoint: "/v1/gstin/search",
            providerMethod: "POST",
            priority: 1,
          },
        ],
      },
    },
  });

  // 7. Seed Sample Historical Logs & Specialized Reports
  const samplePans = [
    { pan: "AAACA5678B", name: "VIKRAM MALHOTRA", category: "INDIVIDUAL", status: "VALID", linked: true },
    { pan: "BCDEK9981F", name: "PRIYA SHARMA", category: "INDIVIDUAL", status: "VALID", linked: true },
    { pan: "AABCC1234F", name: "COLLADOME TECH PVT LTD", category: "COMPANY", status: "VALID", linked: false },
    { pan: "ZZZZZ9999Z", name: "INVALID RECORD", category: "UNKNOWN", status: "INVALID", linked: false },
  ];

  for (let i = 0; i < samplePans.length; i++) {
    const item = samplePans[i];
    const orderId = `CDO_20261014_${100000 + i}`;
    const log = await prisma.apiLog.create({
      data: {
        colladomeOrderId: orderId,
        clientOrderId: `ORD_ACME_PAN_${100 + i}`,
        userId: clientAcme.id,
        apiId: apiPan.id,
        providerId: provZoop.id,
        providerOrderId: `ZOOP_TXN_${800000 + i}`,
        ipAddress: "103.21.244.15",
        endpointPath: apiPan.endpointPath,
        httpMethod: "POST",
        requestHeaders: JSON.stringify({ "x-api-key": liveRawKey.slice(0, 12) + "..." }),
        requestBody: JSON.stringify({ pan_number: item.pan, consent: "Y" }),
        responseStatus: item.status === "VALID" ? 200 : 422,
        responseBody: JSON.stringify({
          status: item.status === "VALID" ? "SUCCESS" : "FAILED",
          colladome_order_id: orderId,
          data: {
            pan_number: item.pan,
            full_name: item.name,
            category: item.category,
            status: item.status,
            pan_aadhaar_linked: item.linked,
          },
        }),
        status: item.status === "VALID" ? "SUCCESS" : "FAILED",
        latencyMs: 180 + Math.floor(Math.random() * 90),
        costPrice: 1.80,
        sellPrice: 2.10, // Acme custom price
        marginProfit: 0.30,
        panReport: {
          create: {
            userId: clientAcme.id,
            panNumber: item.pan,
            fullName: item.name,
            category: item.category,
            status: item.status,
            panAadhaarLinked: item.linked,
          },
        },
      },
    });

    // Wallet debit transaction
    if (clientAcme.wallet && item.status === "VALID") {
      await prisma.walletTransaction.create({
        data: {
          walletId: clientAcme.wallet.id,
          amount: 2.10,
          type: "DEBIT",
          balanceBefore: 45202.10,
          balanceAfter: 45200.00,
          referenceId: orderId,
          description: `API Hit: ${apiPan.name} (${item.pan})`,
        },
      });
    }
  }

  // Sample Bank Verification Hits
  const sampleBanks = [
    { acc: "001201509823", ifsc: "HDFC0000012", name: "VIKRAM MALHOTRA", bank: "HDFC BANK", utr: "2026101499812481", status: "VERIFIED" },
    { acc: "389201992819", ifsc: "SBIN0001824", name: "PRIYA SHARMA", bank: "STATE BANK OF INDIA", utr: "2026101418293712", status: "VERIFIED" },
  ];

  for (let i = 0; i < sampleBanks.length; i++) {
    const item = sampleBanks[i];
    const orderId = `CDO_20261014_${200000 + i}`;
    await prisma.apiLog.create({
      data: {
        colladomeOrderId: orderId,
        clientOrderId: `ORD_ACME_BNK_${200 + i}`,
        userId: clientAcme.id,
        apiId: apiBank.id,
        providerId: provDecentro.id,
        providerOrderId: `DEC_TXN_${900000 + i}`,
        ipAddress: "103.21.244.15",
        endpointPath: apiBank.endpointPath,
        httpMethod: "POST",
        requestHeaders: JSON.stringify({ "x-api-key": liveRawKey.slice(0, 12) + "..." }),
        requestBody: JSON.stringify({ account_number: item.acc, ifsc_code: item.ifsc, beneficiary_name: item.name }),
        responseStatus: 200,
        responseBody: JSON.stringify({
          status: "SUCCESS",
          colladome_order_id: orderId,
          data: {
            account_number: item.acc,
            ifsc_code: item.ifsc,
            bank_name: item.bank,
            name_at_bank: item.name,
            name_match_score: 99.0,
            utr_number: item.utr,
            status: item.status,
          },
        }),
        status: "SUCCESS",
        latencyMs: 310 + Math.floor(Math.random() * 80),
        costPrice: 2.20,
        sellPrice: 3.50,
        marginProfit: 1.30,
        bankReport: {
          create: {
            userId: clientAcme.id,
            accountNumber: item.acc,
            ifscCode: item.ifsc,
            beneficiaryName: item.name,
            nameAtBank: item.name,
            matchPercentage: 99.0,
            utrNumber: item.utr,
            status: item.status,
          },
        },
      },
    });
  }

  console.log("Database seeded successfully with sample clients, providers, APIs, and reports!");
  console.log("=========================================");
  console.log("Super Admin Login: admin@colladome.com | Password: Admin@123");
  console.log("Acme Client Login:  fintech@acme.com  | Password: Acme@123");
  console.log(`Acme Live Key:      ${liveRawKey}`);
  console.log(`Acme Test Key:      ${testRawKey}`);
  console.log("=========================================");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
