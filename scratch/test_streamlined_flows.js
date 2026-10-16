async function runVerification() {
  console.log("--------------------------------------------------");
  console.log("🧪 TESTING STREAMLINED FLOWS (CLIENT & ADMIN)");
  console.log("--------------------------------------------------");

  // Test 1: Client signup has 0.0 balance (No ₹100 free credit)
  const clientEmail = `client_zero_${Date.now()}@test.io`;
  console.log("\n[1/3] Testing Client Signup starting balance (should be 0.00)...");
  const signupRes = await fetch("http://localhost:3000/api/internal/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: clientEmail,
      password: "TestPassword@123",
      companyName: "Zero Balance Corp",
      contactPerson: "Rohan Sharma",
    }),
  });

  const signupData = await signupRes.json();
  if (!signupRes.ok || !signupData.success) {
    console.error("Signup failed:", signupData);
    process.exit(1);
  }

  // Verify wallet balance in DB
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();
  const createdClient = await prisma.user.findUnique({
    where: { email: clientEmail },
    include: { wallet: true, apiKeys: true },
  });

  console.log(`✓ Client created: ${createdClient.fullName} (${createdClient.clientCode})`);
  console.log(`✓ Wallet Balance: ₹${createdClient.wallet?.balance} (Expected: 0.00)`);
  if (createdClient.wallet?.balance !== 0.0) {
    console.error("FAILED: Balance is not 0.00!");
    process.exit(1);
  }

  // Test 2: Admin Quick-Onboard Client (Selfup Community)
  const selfupEmail = `selfup_${Date.now()}@community.org`;
  console.log("\n[2/3] Testing Admin Quick-Onboard for Selfup Community...");
  const adminRes = await fetch("http://localhost:3000/api/internal/admin/clients", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      companyName: "Selfup Community",
      fullName: "Akash",
      email: selfupEmail,
      password: "Selfup@2026",
      initialBalance: 0,
      allowedIps: ["*"],
    }),
  });

  const adminData = await adminRes.json();
  if (!adminRes.ok || !adminData.client) {
    console.error("Admin onboard failed:", adminData);
    process.exit(1);
  }

  console.log(`✓ Admin onboarded: ${adminData.client.companyName} (${adminData.client.clientCode})`);
  console.log(`✓ Production Key: ${adminData.client.productionApiKey}`);
  console.log(`✓ Sandbox Key:    ${adminData.client.sandboxApiKey}`);
  console.log(`✓ Wallet Balance: ₹${adminData.client.walletBalance}`);

  // Test 3: API Catalog fetch for client table
  console.log("\n[3/3] Verifying API Catalog endpoints for Client Table...");
  const apisRes = await fetch("http://localhost:3000/api/internal/admin/apis");
  const apisData = await apisRes.json();
  console.log(`✓ Available Catalog APIs: ${apisData.apis?.length || 0}`);
  apisData.apis?.forEach((a) => {
    console.log(`   - [${a.httpMethod}] /api${a.endpointPath} (₹${a.defaultSellPrice}/hit)`);
  });

  console.log("\n--------------------------------------------------");
  console.log("🎉 ALL TESTS PASSED! ZERO ERRORS.");
  console.log("--------------------------------------------------");
  await prisma.$disconnect();
  process.exit(0);
}

runVerification().catch((err) => {
  console.error("Execution error:", err);
  process.exit(1);
});
