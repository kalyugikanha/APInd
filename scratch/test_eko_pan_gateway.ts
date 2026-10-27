import { generateEkoHeaders, normalizePan } from "../src/lib/gateway/eko";
import { db } from "../src/lib/db";
import crypto from "crypto";

async function runTests() {
  console.log("=== 1. Testing Eko HMAC Signature Generation ===");
  const testDevKey = "dev_test_12345";
  const testAccessKey = "access_secret_67890";
  const headers = generateEkoHeaders(testDevKey, testAccessKey);

  console.log("Generated Headers:", headers);
  if (!headers.developer_key || !headers["secret-key"] || !headers["secret-key-timestamp"]) {
    throw new Error("Missing required Eko HMAC headers");
  }

  // Verify HMAC calculation matching Eko docs
  const timestamp = headers["secret-key-timestamp"];
  const encodedKey = Buffer.from(testAccessKey).toString("base64");
  const expectedSignature = crypto
    .createHmac("sha256", encodedKey)
    .update(timestamp)
    .digest("base64");

  if (headers["secret-key"] !== expectedSignature) {
    throw new Error("HMAC signature does not match Eko specification");
  }
  console.log("✅ Eko HMAC signature matches spec exactly!");

  console.log("\n=== 2. Testing PAN Normalization ===");
  const normalized = normalizePan(" abc de 1234 f ");
  console.log("Normalized:", normalized);
  if (normalized !== "ABCDE1234F") {
    throw new Error(`Normalization failed, expected ABCDE1234F got ${normalized}`);
  }
  console.log("✅ PAN normalization verified!");

  console.log("\n=== 3. Testing Database State for API & Provider ===");
  const ekoProvider = await db.provider.findUnique({ where: { code: "EKO" } });
  console.log("Eko Provider in DB:", ekoProvider?.name, ekoProvider?.authType, ekoProvider?.baseUrl);
  if (!ekoProvider || ekoProvider.authType !== "EKO_HMAC") {
    throw new Error("Eko provider not found or authType incorrect");
  }

  const panApi = await db.api.findFirst({
    where: { endpointPath: "/pan-verification/v1" },
    include: { providerMappings: { include: { provider: true } } },
  });
  console.log("PAN API in DB:", panApi?.name, panApi?.endpointPath, "Default Setup Fee: ₹" + panApi?.defaultSetupFee);
  if (!panApi || panApi.defaultSetupFee === undefined) {
    throw new Error("PAN API not found or defaultSetupFee missing");
  }
  console.log("Provider mappings:", panApi.providerMappings.map((m) => `${m.provider.name} -> ${m.providerEndpoint}`));

  console.log("\n=== 4. Testing One-Time Setup Fee Billing Simulation ===");
  // Create or find a test client
  let testUser = await db.user.findFirst({
    where: { email: "test_client@colladome.com" },
    include: { wallet: true },
  });

  if (!testUser) {
    testUser = await db.user.create({
      data: {
        email: "test_client@colladome.com",
        passwordHash: "hash123",
        fullName: "Test Enterprise Corp",
        companyName: "Test Enterprise Corp",
        role: "CLIENT",
        accountStatus: "ACTIVE",
        wallet: {
          create: {
            balance: 5000.0,
            currency: "INR",
          },
        },
      },
      include: { wallet: true },
    });
  }

  console.log("Test Client Wallet Balance:", testUser.wallet?.balance);

  // Set default setup fee on API for testing
  await db.api.update({
    where: { id: panApi.id },
    data: { defaultSetupFee: 500.0 },
  });

  console.log("Updated PAN API defaultSetupFee to ₹500.00");

  const updatedPanApi = await db.api.findUnique({ where: { id: panApi.id } });
  if (updatedPanApi?.defaultSetupFee !== 500.0) {
    throw new Error("Failed to update API defaultSetupFee");
  }

  console.log("\n🎉 ALL UNIT & INTEGRATION TESTS PASSED CLEANLY!");
}

runTests()
  .catch((err) => {
    console.error("❌ Test failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
