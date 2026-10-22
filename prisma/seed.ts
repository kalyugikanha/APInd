import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import { ifscApiData } from "./ifscApi";

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

/**
 * Non-destructive catalog sync for an already-initialized database (e.g. Render restart/redeploy).
 * Keeps all clients, wallets, keys and logs. Retires legacy dummy APIs and ensures the IFSC API exists.
 */
async function syncCatalog() {
  console.log("♻️  Database already initialized — running NON-DESTRUCTIVE catalog sync (clients & wallets untouched).");

  // 1. Purge legacy dummy APIs and any old dummy logs/mappings so they never clutter the catalog
  const legacySlugs = ["pan-verification", "bank-account-verify", "gstin-verification"];
  for (const slug of legacySlugs) {
    const legacy = await prisma.api.findUnique({ where: { slug } });
    if (!legacy) continue;
    const logs = await prisma.apiLog.findMany({ where: { apiId: legacy.id }, select: { id: true } });
    const logIds = logs.map((l) => l.id);
    if (logIds.length > 0) {
      await prisma.bankReport.deleteMany({ where: { apiLogId: { in: logIds } } });
      await prisma.panReport.deleteMany({ where: { apiLogId: { in: logIds } } });
      await prisma.apiLog.deleteMany({ where: { apiId: legacy.id } });
    }
    await prisma.clientPricing.deleteMany({ where: { apiId: legacy.id } });
    await prisma.apiProviderMapping.deleteMany({ where: { apiId: legacy.id } });
    await prisma.api.delete({ where: { id: legacy.id } });
    console.log(`🗑️  Removed legacy dummy API: ${legacy.name}`);
  }

  // 2. Ensure Banking category, Zoop provider, and IFSC API exist
  const catBanking = await prisma.apiCategory.upsert({
    where: { slug: "banking-financials" },
    update: {},
    create: {
      name: "Banking & Financials",
      slug: "banking-financials",
      description: "Instant IFSC bank branch lookups, penny drop account verification, and UPI validation.",
      icon: "Building2",
      sortOrder: 1,
    },
  });

  let zoop = await prisma.provider.findUnique({ where: { code: "ZOOP" } });
  if (!zoop) {
    zoop = await prisma.provider.create({
      data: {
        name: "Primary Gateway",
        code: "ZOOP",
        baseUrl: "https://test.zoop.one",
        authType: "HEADER_API_KEY",
        credentialsEnc: encrypt(JSON.stringify({ apiKey: "", appId: "", isSimulation: true })),
        isActive: true,
      },
    });
  }

  const existingIfsc = await prisma.api.findUnique({ where: { slug: "ifsc-verification" } });
  if (!existingIfsc) {
    await prisma.api.create({ data: ifscApiData(catBanking.id, zoop.id) });
    console.log("✅ IFSC Code Verification API added to catalog.");
  } else {
    console.log("✅ IFSC Code Verification API already present.");
  }
}

async function main() {
  console.log("--------------------------------------------------");
  console.log("🌱 Initializing Clean Production Colladome Platform...");
  console.log("--------------------------------------------------");

  // SAFETY: never wipe a live database on restart. Full reset requires FORCE_RESEED=true.
  const existingAdmin = await prisma.user.findUnique({ where: { email: "admin@colladome.com" } });
  if (existingAdmin && process.env.FORCE_RESEED !== "true") {
    await syncCatalog();
    return;
  }

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
      name: "Primary Gateway",
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
      name: "Secondary Gateway",
      code: "IDFY",
      baseUrl: "https://api.idfy.com",
      authType: "BEARER_TOKEN",
      credentialsEnc: encrypt(JSON.stringify({ apiKey: "", isSimulation: true })),
      isActive: true,
    },
  });

  const provDecentro = await prisma.provider.create({
    data: {
      name: "Backup Gateway",
      code: "DECENTRO",
      baseUrl: "https://api.decentro.tech",
      authType: "HEADER_API_KEY",
      credentialsEnc: encrypt(JSON.stringify({ clientId: "", clientSecret: "", isSimulation: true })),
      isActive: true,
    },
  });

  const provSurpass = await prisma.provider.create({
    data: {
      name: "Direct Route",
      code: "SURPASS",
      baseUrl: "https://api.surpass.in",
      authType: "HEADER_API_KEY",
      credentialsEnc: encrypt(JSON.stringify({ apiKey: "", isSimulation: true })),
      isActive: true,
    },
  });
  console.log("✅ Upstream providers initialized (Primary Gateway, Secondary Gateway, Backup Gateway, Direct Route).");

  // 4. Official Real Gateway API: IFSC Code Verification
  const apiIfsc = await prisma.api.create({ data: ifscApiData(catBanking.id, provZoop.id) });
  console.log(`✅ Production Gateway API initialized: ${apiIfsc.name} (${apiIfsc.endpointPath})`);

  console.log("--------------------------------------------------");
  console.log("✨ CLEAN PRODUCTION INITIALIZATION COMPLETE!");
  console.log("--------------------------------------------------");
  console.log("Super Admin Login: admin@colladome.com");
  console.log("Password:          Admin@123");
  console.log("Gateway API:       POST /ifsc-verification/v1");
  console.log("Base Cost:         ₹0.50");
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
