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

  // Clean old sample/dummy data to ensure pristine production state
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
  const catIdentity = await prisma.apiCategory.create({
    data: {
      name: "Identity Verification",
      slug: "identity-verification",
      description: "Verify Indian identity documents including PAN, Aadhaar, Voter ID, and Passport.",
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
  console.log("✅ Core categories created.");

  // 3. Official Upstream Providers
  const provZoop = await prisma.provider.create({
    data: {
      name: "Zoop.one",
      code: "ZOOP",
      baseUrl: "https://api.zoop.one",
      authType: "HEADER_API_KEY",
      credentialsEnc: encrypt(JSON.stringify({ apiKey: "", appId: "", isSimulation: true })),
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
  console.log("✅ Providers initialized (Zoop, IDFY, Decentro, Surpass).");

  // 4. Production Gateway APIs
  // API 1: PAN Detailed Verification
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
        full_name: "TAXPAYER NAME",
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
            priority: 1,
            requestTransform: JSON.stringify({ customer_pan_number: "pan_number", consent: "consent" }),
            responseExtract: JSON.stringify({ name: "result.user_full_name", status: "result.pan_status" }),
          },
          {
            providerId: provIdfy.id,
            providerEndpoint: "/v3/tasks/async/verify_with_source/ind_pan",
            providerMethod: "POST",
            priority: 2,
            requestTransform: JSON.stringify({ id_number: "pan_number" }),
          },
        ],
      },
    },
  });

  // API 2: Bank Account Penny Drop Verification
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
        beneficiary_name: { type: "string", required: false, example: "BENEFICIARY NAME", description: "Expected name for match scoring" },
      }),
      responseSchema: JSON.stringify({
        account_number: "001201509823",
        ifsc_code: "HDFC0000012",
        bank_name: "HDFC BANK",
        name_at_bank: "BENEFICIARY NAME",
        name_match_score: 99.0,
        utr_number: "2026101599812481",
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
            providerEndpoint: "/v3/tasks/async/verify_with_source/ind_bank",
            providerMethod: "POST",
            priority: 2,
          },
        ],
      },
    },
  });

  // API 3: GSTIN Business Verification
  const apiGst = await prisma.api.create({
    data: {
      categoryId: catBusiness.id,
      name: "GSTIN Business & Tax Verification",
      slug: "gstin-verification",
      endpointPath: "/v1/business/gstin-verify",
      httpMethod: "POST",
      description: "Validates GST Identification Number (GSTIN) directly from GST portal. Returns legal business name, trade name, taxpayer type, filing status, and principal place of business.",
      useCase: "B2B vendor onboarding, merchant verification, and invoice financing.",
      status: "ACTIVE",
      defaultCostPrice: 1.50,
      defaultSellPrice: 2.20,
      requestSchema: JSON.stringify({
        gstin: { type: "string", required: true, example: "27AABCC1234F1Z8" },
      }),
      responseSchema: JSON.stringify({
        gstin: "27AABCC1234F1Z8",
        legal_name: "COMPANY NAME",
        trade_name: "BRAND NAME",
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
  console.log("✅ Production Gateway APIs initialized (PAN, Bank Penny Drop, GSTIN).");

  console.log("--------------------------------------------------");
  console.log("✨ CLEAN PRODUCTION INITIALIZATION COMPLETE!");
  console.log("--------------------------------------------------");
  console.log("Super Admin Login: admin@colladome.com");
  console.log("Password:          Admin@123");
  console.log("Clients:           0 (Ready for real enterprise registrations)");
  console.log("API Logs:          0 (Clean real-time hit stream)");
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
