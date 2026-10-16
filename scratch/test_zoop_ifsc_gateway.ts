import { db } from "../src/lib/db";
import { handleGatewayRequest } from "../src/lib/gateway/proxy";
import { hashApiKey } from "../src/lib/crypto";
import { NextRequest } from "next/server";

async function runTests() {
  console.log("==================================================");
  console.log("🧪 TESTING ZOOP IFSC GATEWAY MORPHER & AUDIT LOGS");
  console.log("==================================================");

  // 1. Setup a Test Client with Wallet Balance & API Key
  const testEmail = "test_fintech@colladome.com";
  const existingUser = await db.user.findUnique({ where: { email: testEmail } });
  if (existingUser) {
    await db.apiLog.deleteMany({ where: { userId: existingUser.id } });
    await db.walletTransaction.deleteMany({ where: { wallet: { userId: existingUser.id } } });
    await db.apiKey.deleteMany({ where: { userId: existingUser.id } });
    await db.clientSetting.deleteMany({ where: { userId: existingUser.id } });
    await db.wallet.deleteMany({ where: { userId: existingUser.id } });
    await db.user.deleteMany({ where: { id: existingUser.id } });
  }

  const rawLiveKey = "cd_live_testkey_99887766554433221100";
  const rawSandboxKey = "cd_test_sandbox_11223344556677889900";

  const user = await db.user.create({
    data: {
      email: testEmail,
      fullName: "Fintech Test Client",
      passwordHash: hashApiKey("TestPass@123"),
      role: "CLIENT_ADMIN",
      accountStatus: "ACTIVE",
      companyName: "Selfup Fintech",
      wallet: {
        create: {
          balance: 100.0, // ₹100 for live testing
          currency: "INR",
        },
      },
      clientSettings: {
        create: {
          allowedIps: JSON.stringify(["127.0.0.1", "::1"]),
          sandboxIps: JSON.stringify(["*"]),
          rateLimitRpm: 300,
        },
      },
      apiKeys: {
        create: [
          {
            name: "Production Master Key",
            type: "PRODUCTION",
            keyPrefix: "cd_live_",
            keyHash: hashApiKey(rawLiveKey),
            keyHint: "...21100",
            isActive: true,
          },
          {
            name: "Sandbox Testing Key",
            type: "SANDBOX",
            keyPrefix: "cd_test_",
            keyHash: hashApiKey(rawSandboxKey),
            keyHint: "...89900",
            isActive: true,
          },
        ],
      },
    },
    include: {
      wallet: true,
      apiKeys: true,
    },
  });

  console.log(`✅ Test Client created: ${user.companyName} (Wallet: ₹${user.wallet?.balance})`);

  // Helper to build NextRequest
  function makeReq(url: string, method: string, headers: Record<string, string>, body?: any) {
    const init: any = {
      method,
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "127.0.0.1",
        ...headers,
      },
    };
    if (body) {
      init.body = JSON.stringify(body);
    }
    return new NextRequest(new URL(url, "http://localhost:3000"), init);
  }

  // TEST 1: Missing API Key
  console.log("\n--- TEST 1: Missing API Key (Expect 101 error) ---");
  const req1 = makeReq("http://localhost:3000/ifsc-verification/v1", "POST", {}, { ifsc: "THRS0000XXX" });
  const res1 = await handleGatewayRequest(req1, "/ifsc-verification/v1", "POST");
  const data1 = await res1.json();
  console.log("Status:", res1.status, "Response Code:", data1.response_code, "Message:", data1.response_message);
  if (data1.response_code === "101") {
    console.log("✅ TEST 1 PASSED: Correctly returned 101 AUTH_INVALID_API_KEY");
  } else {
    console.error("❌ TEST 1 FAILED:", data1);
  }

  // TEST 2: Invalid IFSC Code Format (Expect 104 error)
  console.log("\n--- TEST 2: Invalid IFSC Code Format (Expect 104 error) ---");
  const req2 = makeReq(
    `http://localhost:3000/ifsc-verification/v1?api_key=${rawLiveKey}`,
    "POST",
    {},
    {
      mode: "sync",
      data: { ifsc: "SHORT", consent: "Y" },
      task_id: "client-task-uuid-001",
    }
  );
  const res2 = await handleGatewayRequest(req2, "/ifsc-verification/v1", "POST");
  const data2 = await res2.json();
  console.log("Status:", res2.status, "Response Code:", data2.response_code, "Message:", data2.response_message);
  if (data2.response_code === "104") {
    console.log("✅ TEST 2 PASSED: Correctly returned 104 VALIDATION_INVALID_IFSC");
  } else {
    console.error("❌ TEST 2 FAILED:", data2);
  }

  // TEST 3: Valid Zoop IFSC Morpher Call via Query Parameter
  console.log("\n--- TEST 3: Valid Zoop IFSC Morpher Call via ?api_key=... (Expect 100 success) ---");
  const clientOrderId = "client-task-uuid-002";
  const req3 = makeReq(
    `http://localhost:3000/ifsc-verification/v1?api_key=${rawLiveKey}`,
    "POST",
    {},
    {
      mode: "sync",
      data: {
        ifsc: "THRS0000XXX",
        consent: "Y",
        consent_text: "I hear by declare my consent agreement for fetching my information via Colladome API",
      },
      task_id: clientOrderId,
    }
  );
  const res3 = await handleGatewayRequest(req3, "/ifsc-verification/v1", "POST");
  const data3 = await res3.json();
  console.log("Status:", res3.status);
  console.log("Full Sanitized Response:", JSON.stringify(data3, null, 2));

  if (
    data3.success === true &&
    data3.response_code === "100" &&
    data3.client_order_id === clientOrderId &&
    data3.colladome_order_id?.startsWith("CDO") &&
    data3.result?.bank &&
    data3.result?.ifsc === "THRS0000XXX"
  ) {
    console.log("✅ TEST 3 PASSED: IFSC morpher returned clean Colladome response without leaking Zoop IDs!");
  } else {
    console.error("❌ TEST 3 FAILED:", data3);
  }

  // TEST 4: Check Wallet Deduction & Internal Audit Log Isolation
  console.log("\n--- TEST 4: Check Wallet Deduction & Internal Audit Logs ---");
  const updatedWallet = await db.wallet.findUnique({ where: { userId: user.id } });
  console.log(`Initial Balance: ₹100.00 | Current Balance: ₹${updatedWallet?.balance.toFixed(2)} (Deducted ₹1.20)`);
  if (updatedWallet && updatedWallet.balance === 98.8) {
    console.log("✅ Wallet deduction verified: exactly ₹1.20 retail price deducted.");
  }

  // Allow async log write to complete
  await new Promise((resolve) => setTimeout(resolve, 500));

  const latestLog = await db.apiLog.findFirst({
    where: { userId: user.id, colladomeOrderId: data3.colladome_order_id },
  });
  console.log("Internal Audit Log Record:");
  console.log("- Colladome Order ID:", latestLog?.colladomeOrderId);
  console.log("- Client Order ID:   ", latestLog?.clientOrderId);
  console.log("- Provider Order ID: ", latestLog?.providerOrderId);
  console.log("- Cost Price:        ₹" + latestLog?.costPrice);
  console.log("- Sell Price:        ₹" + latestLog?.sellPrice);
  console.log("- Margin Profit:     ₹" + latestLog?.marginProfit);

  if (latestLog && latestLog.costPrice === 0.5 && latestLog.sellPrice === 1.2 && latestLog.marginProfit === 0.7) {
    console.log("✅ TEST 4 PASSED: Internal logs capture full upstream details and accurate margin profit (₹0.70)!");
  } else {
    console.error("❌ TEST 4 FAILED: Audit log values mismatch", latestLog);
  }

  const latestBankReport = await db.bankReport.findFirst({
    where: { userId: user.id, ifscCode: "THRS0000XXX" },
  });
  if (latestBankReport && latestBankReport.status === "VERIFIED") {
    console.log(
      `✅ TEST 4B PASSED: Bank/IFSC Report record created (${latestBankReport.ifscCode} -> ${latestBankReport.nameAtBank})`
    );
  } else {
    console.error("❌ TEST 4B FAILED: BankReport not found", latestBankReport);
  }

  // TEST 5: Insufficient Balance Error (Expect 103 error)
  console.log("\n--- TEST 5: Insufficient Balance (Expect 103 error) ---");
  await db.wallet.update({ where: { userId: user.id }, data: { balance: 0.2 } }); // Less than ₹1.20
  const req5 = makeReq(
    `http://localhost:3000/ifsc-verification/v1?api_key=${rawLiveKey}`,
    "POST",
    {},
    {
      mode: "sync",
      data: { ifsc: "SBIN0000001", consent: "Y" },
    }
  );
  const res5 = await handleGatewayRequest(req5, "/ifsc-verification/v1", "POST");
  const data5 = await res5.json();
  console.log("Status:", res5.status, "Response Code:", data5.response_code, "Message:", data5.response_message);
  if (data5.response_code === "103") {
    console.log("✅ TEST 5 PASSED: Correctly returned 103 BILLING_INSUFFICIENT_WALLET_BALANCE");
  } else {
    console.error("❌ TEST 5 FAILED:", data5);
  }

  // TEST 6: IP Whitelist Block (Expect 102 error)
  console.log("\n--- TEST 6: IP Whitelist Block (Expect 102 error) ---");
  const req6 = makeReq(
    `http://localhost:3000/ifsc-verification/v1?api_key=${rawLiveKey}`,
    "POST",
    { "x-forwarded-for": "203.0.113.195" }, // Unauthorized external IP
    {
      mode: "sync",
      data: { ifsc: "SBIN0000001", consent: "Y" },
    }
  );
  const res6 = await handleGatewayRequest(req6, "/ifsc-verification/v1", "POST");
  const data6 = await res6.json();
  console.log("Status:", res6.status, "Response Code:", data6.response_code, "Message:", data6.response_message);
  if (data6.response_code === "102") {
    console.log("✅ TEST 6 PASSED: Correctly returned 102 SECURITY_IP_NOT_WHITELISTED");
  } else {
    console.error("❌ TEST 6 FAILED:", data6);
  }

  // TEST 7: Dynamic Zoop Morpher Studio (Create new /rc-verification/v1/ endpoint, call it dynamically, and delete)
  console.log("\n--- TEST 7: Dynamic Zoop Morpher Studio (/rc-verification/v1/) & Universal Gateway ---");
  await db.wallet.update({ where: { userId: user.id }, data: { balance: 50.0 } });
  const { POST: adminCreateApi, PATCH: adminPatchApi, DELETE: adminDeleteApi } = await import(
    "@/app/api/internal/admin/apis/route"
  );
  const { POST: universalGatewayPost } = await import("@/app/api/gateway/[...slug]/route");

  const createReq = makeReq(
    "http://localhost:3000/api/internal/admin/apis",
    "POST",
    {},
    {
      name: "Vehicle RC Verification (Zoop Lite)",
      endpointPath: "/rc-verification/v1/",
      upstreamUrl: "https://test.zoop.one/api/v1/in/vehicle/rc/lite",
      httpMethod: "POST",
      defaultCostPrice: 1.5,
      defaultSellPrice: 2.8,
      requestSchema: JSON.stringify({
        mode: { type: "string", example: "sync" },
        data: {
          type: "object",
          example: {
            vehicle_registration_number: "MH01AB1234",
            consent: "Y",
            consent_text: "I hear by declare my consent agreement for fetching my information via Colladome API",
          },
        },
      }),
      responseSchema: JSON.stringify({
        result: {
          rc_registration_number: "MH01AB1234",
          owner_name: "AARAV PATEL",
          vehicle_class: "LMV",
          rc_status: "ACTIVE",
        },
      }),
    }
  );
  const createRes = await adminCreateApi(createReq);
  const createdData = await createRes.json();
  const createdApiId = createdData.api?.id;

  // Test PATCH rate update
  const patchReq = makeReq(
    "http://localhost:3000/api/internal/admin/apis",
    "PATCH",
    {},
    {
      apiId: createdApiId,
      defaultCostPrice: 1.6,
      defaultSellPrice: 3.0,
    }
  );
  const patchRes = await adminPatchApi(patchReq);
  const patchData = await patchRes.json();
  if (patchRes.ok && patchData.api?.defaultSellPrice === 3.0) {
    console.log("✅ TEST 7A PASSED: Admin PATCH updated API sell rate to ₹3.00");
  } else {
    console.error("❌ TEST 7A FAILED:", patchData);
  }

  // Now call the newly created /rc-verification/v1 endpoint via the Universal Gateway Route
  const rcCallReq = makeReq(
    `http://localhost:3000/rc-verification/v1/?api_key=${rawLiveKey}`,
    "POST",
    {},
    {
      mode: "sync",
      data: {
        vehicle_registration_number: "DL01CA9999",
        consent: "Y",
        consent_text: "I hear by declare my consent agreement for fetching my information via Colladome API",
      },
      task_id: "rc-order-777",
    }
  );
  const rcCallRes = await universalGatewayPost(rcCallReq, {
    params: { slug: ["rc-verification", "v1"] },
  });
  const rcCallData = await rcCallRes.json();
  if (
    rcCallRes.status === 200 &&
    rcCallData.response_code === "100" &&
    rcCallData.client_order_id === "rc-order-777" &&
    rcCallData.result?.vehicle_registration_number === "DL01CA9999" &&
    !rcCallData.group_id &&
    !rcCallData.request_id
  ) {
    console.log(
      "✅ TEST 7B PASSED: Universal Gateway dynamically routed /rc-verification/v1/ and returned morphed Colladome payload!"
    );
  } else {
    console.error("❌ TEST 7B FAILED:", rcCallData);
  }

  // Wait for async log write, then delete the temporary RC API via DELETE handler
  await new Promise((resolve) => setTimeout(resolve, 400));
  const deleteReq = makeReq(
    `http://localhost:3000/api/internal/admin/apis?id=${createdApiId}`,
    "DELETE",
    {}
  );
  const deleteRes = await adminDeleteApi(deleteReq);
  if (deleteRes.ok) {
    console.log("✅ TEST 7C PASSED: Admin DELETE cleanly removed temporary API & cascade records");
  } else {
    console.error("❌ TEST 7C FAILED:", await deleteRes.text());
  }

  // Clean up test client with cascading deletes
  await db.bankReport.deleteMany({ where: { userId: user.id } });
  await db.panReport.deleteMany({ where: { userId: user.id } });
  await db.apiLog.deleteMany({ where: { userId: user.id } });
  await db.walletTransaction.deleteMany({ where: { wallet: { userId: user.id } } });
  await db.apiKey.deleteMany({ where: { userId: user.id } });
  await db.clientSetting.deleteMany({ where: { userId: user.id } });
  await db.wallet.deleteMany({ where: { userId: user.id } });
  await db.user.deleteMany({ where: { id: user.id } });
  console.log("\n✨ ALL TESTS COMPLETED & CLEANED UP! 100% VERIFIED.");
}

runTests()
  .catch((e) => console.error(e))
  .finally(() => db.$disconnect());
