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
  console.log("--------------------------------------------------");
  console.log("🌱 Initializing Clean Production Colladome Platform...");
  console.log("--------------------------------------------------");

  // Clean old sample/dummy data to ensure pristine state
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

  // 1. Super Admin Account
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
  console.log(`✅ Super Admin created: ${admin.email}`);

  // 2. Core API Categories
  const catBanking = await prisma.apiCategory.create({
    data: {
      name: "Banking & Financials",
      slug: "banking-financials",
      description: "Instant IFSC bank branch lookups, penny drop account verification, and UPI validation.",
      icon: "Building2",
      sortOrder: 1,
    },
  });

  const catIdentity = await prisma.apiCategory.create({
    data: {
      name: "Identity Verification",
      slug: "identity-verification",
      description: "Verify Indian identity documents including PAN, Aadhaar, Voter ID, and Passport.",
      icon: "ShieldCheck",
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
  console.log("✅ Core categories created.");

  // 3. Official Upstream Providers
  const provZoop = await prisma.provider.create({
    data: {
      name: "Zoop.one",
      code: "ZOOP",
      baseUrl: "https://test.zoop.one",
      authType: "HEADER_API_KEY",
      credentialsEnc: encrypt(
        JSON.stringify({
          apiKey: process.env.ZOOP_API_KEY || "",
          appId: process.env.ZOOP_APP_ID || "",
          isSimulation: !process.env.ZOOP_API_KEY,
        })
      ),
      isActive: true,
    },
  });

  const provIdfy = await prisma.provider.create({
    data: {
      name: "IDFY (Baldor)",
      code: "IDFY",
      baseUrl: "https://api.idfy.com",
      authType: "BEARER_TOKEN",
      credentialsEnc: encrypt(JSON.stringify({ apiKey: "", isSimulation: true })),
      isActive: true,
    },
  });

  const provDecentro = await prisma.provider.create({
    data: {
      name: "Decentro Tech",
      code: "DECENTRO",
      baseUrl: "https://api.decentro.tech",
      authType: "HEADER_API_KEY",
      credentialsEnc: encrypt(JSON.stringify({ clientId: "", clientSecret: "", isSimulation: true })),
      isActive: true,
    },
  });

  const provSurpass = await prisma.provider.create({
    data: {
      name: "Surpass Data",
      code: "SURPASS",
      baseUrl: "https://api.surpass.in",
      authType: "HEADER_API_KEY",
      credentialsEnc: encrypt(JSON.stringify({ apiKey: "", isSimulation: true })),
      isActive: true,
    },
  });
  console.log("✅ Upstream providers initialized (Zoop.one, IDFY, Decentro, Surpass).");

  // 4. Official Real Gateway API: IFSC Code Verification (Zoop Lite API Morpher)
  // Dummy APIs (PAN, Bank Penny Drop, GSTIN) are completely removed!
  const apiIfsc = await prisma.api.create({
    data: {
      categoryId: catBanking.id,
      name: "IFSC Code Verification",
      slug: "ifsc-verification",
      endpointPath: "/ifsc-verification/v1",
      httpMethod: "POST",
      description:
        "Validates 11-character Indian Financial System Code (IFSC) and returns real-time verified bank branch details including bank name, branch address, contact, MICR, UPI, NEFT, IMPS, and RTGS support status.",
      useCase: "Bank branch lookup, penny drop pre-validation, IMPS/NEFT routing, and vendor payout onboarding.",
      status: "ACTIVE",
      defaultCostPrice: 0.50,
      defaultSellPrice: 1.20,
      requestSchema: JSON.stringify({
        ifsc: {
          type: "string",
          required: true,
          example: "THRS0000XXX",
          description: "11-character alphanumeric Indian bank IFSC code",
        },
        mode: {
          type: "string",
          required: false,
          example: "sync",
          description: "Execution mode ('sync')",
        },
        consent: {
          type: "string",
          required: false,
          example: "Y",
          description: "User consent (Y/N)",
        },
        consent_text: {
          type: "string",
          required: false,
          example: "I hear by declare my consent agreement for fetching my information via Colladome API",
          description: "Consent declaration text",
        },
        task_id: {
          type: "string",
          required: false,
          example: "f26eb21e-4c35-4491-b2d5-41fa0e545a34",
          description: "Optional client order tracking UUID",
        },
      }),
      responseSchema: JSON.stringify({
        success: true,
        response_code: "100",
        response_message: "Valid Authentication",
        colladome_order_id: "CDO_20261016_883291",
        client_order_id: "f26eb21e-4c35-4491-b2d5-41fa0e545a34",
        result: {
          upi: false,
          bank: "Thrissur District Co-Operative Bank",
          city: "KODUNGALLUR",
          ifsc: "THRS0000XXX",
          imps: true,
          micr: "680800002",
          neft: true,
          rtgs: true,
          state: "KERALA",
          branch: "KODUNGALLUR",
          centre: "THRISSUR",
          address: "MAIN ROAD, KODUNGALLUR, THRISSUR DISTRICT, KERALA 680664",
          contact: "0480-2802244",
          district: "THRISSUR",
          bank_code: "THRS",
        },
        timestamp: "2026-10-16T12:35:00.000Z",
      }),
      providerMappings: {
        create: [
          {
            providerId: provZoop.id,
            providerEndpoint: "/api/v1/in/utility/ifsc/lite",
            providerMethod: "POST",
            priority: 1,
            requestTransform: JSON.stringify({
              mode: "sync",
              data: { ifsc: "data.ifsc", consent: "data.consent", consent_text: "data.consent_text" },
              task_id: "colladome_order_id",
            }),
            responseExtract: JSON.stringify({
              result: "result",
              upstream_task_id: "task_id",
              upstream_group_id: "group_id",
              upstream_request_id: "request_id",
            }),
          },
        ],
      },
    },
  });
  console.log(`✅ Production Gateway API initialized: ${apiIfsc.name} (${apiIfsc.endpointPath})`);

  console.log("--------------------------------------------------");
  console.log("✨ CLEAN PRODUCTION INITIALIZATION COMPLETE!");
  console.log("--------------------------------------------------");
  console.log("Super Admin Login: admin@colladome.com");
  console.log("Password:          Admin@123");
  console.log("Gateway API:       POST /ifsc-verification/v1");
  console.log("Base Cost:         ₹0.50 (Zoop Lite)");
  console.log("Retail Sell Price: ₹1.20");
  console.log("Clients:           0 (Ready for real enterprise registrations)");
  console.log("--------------------------------------------------");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
