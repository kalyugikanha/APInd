async function runVerification() {
  console.log("=================================================");
  console.log("🚀 Starting Colladome API Platform E2E Tests...");
  console.log("=================================================");

  const BASE_URL = "http://localhost:3000";
  const LIVE_KEY = "cd_live_acme_prod_secret_88319a2b";
  const SANDBOX_KEY = "cd_test_acme_sand_secret_11928c3d";

  let passed = 0;
  let failed = 0;

  // Test 1: Missing API Key
  try {
    const res = await fetch(`${BASE_URL}/api/v1/verification/pan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pan_number: "AAACA5678B" }),
    });
    const json = await res.json();
    if (res.status === 401 && json.error?.code === "MISSING_API_KEY") {
      console.log("✅ TEST 1 PASSED: Correctly blocked request without API Key (HTTP 401).");
      passed++;
    } else {
      console.error("❌ TEST 1 FAILED:", res.status, json);
      failed++;
    }
  } catch (err) {
    console.error("❌ TEST 1 EXCEPTION:", err);
    failed++;
  }

  // Test 2: Invalid API Key
  try {
    const res = await fetch(`${BASE_URL}/api/v1/verification/pan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": "cd_live_fake_compromised_key_0000",
      },
      body: JSON.stringify({ pan_number: "AAACA5678B" }),
    });
    const json = await res.json();
    if (res.status === 401 && json.error?.code === "INVALID_API_KEY") {
      console.log("✅ TEST 2 PASSED: Correctly rejected invalid/unauthorized API Key (HTTP 401).");
      passed++;
    } else {
      console.error("❌ TEST 2 FAILED:", res.status, json);
      failed++;
    }
  } catch (err) {
    console.error("❌ TEST 2 EXCEPTION:", err);
    failed++;
  }

  // Test 3: PAN Verification through Gateway with Live Key
  try {
    const res = await fetch(`${BASE_URL}/api/v1/verification/pan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": LIVE_KEY,
        "x-client-order-id": "TEST_ORDER_PAN_901",
      },
      body: JSON.stringify({ pan_number: "AAACA5678B", consent: "Y" }),
    });
    const json = await res.json();
    if (
      res.status === 200 &&
      json.status === "SUCCESS" &&
      json.colladome_order_id &&
      json.data?.pan_number === "AAACA5678B"
    ) {
      console.log("✅ TEST 3 PASSED: PAN Verification executed through Colladome Gateway (HTTP 200).");
      console.log("   Order ID:", json.colladome_order_id);
      console.log("   Taxpayer Name:", json.data.full_name);
      console.log("   Status:", json.data.status);
      passed++;
    } else {
      console.error("❌ TEST 3 FAILED:", res.status, json);
      failed++;
    }
  } catch (err) {
    console.error("❌ TEST 3 EXCEPTION:", err);
    failed++;
  }

  // Test 4: Bank Account Penny Drop Verification through Gateway
  try {
    const res = await fetch(`${BASE_URL}/api/v1/banking/bank-verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": LIVE_KEY,
        "x-client-order-id": "TEST_ORDER_BNK_902",
      },
      body: JSON.stringify({
        account_number: "001201509823",
        ifsc_code: "HDFC0000012",
        beneficiary_name: "VIKRAM MALHOTRA",
      }),
    });
    const json = await res.json();
    if (
      res.status === 200 &&
      json.status === "SUCCESS" &&
      json.data?.status === "VERIFIED" &&
      json.data?.utr_number
    ) {
      console.log("✅ TEST 4 PASSED: Bank Account Penny Drop executed through Gateway (HTTP 200).");
      console.log("   Bank Name:", json.data.bank_name);
      console.log("   Name at Bank:", json.data.name_at_bank);
      console.log("   UTR Number:", json.data.utr_number);
      passed++;
    } else {
      console.error("❌ TEST 4 FAILED:", res.status, json);
      failed++;
    }
  } catch (err) {
    console.error("❌ TEST 4 EXCEPTION:", err);
    failed++;
  }

  // Test 5: Instant Sandbox Key Generation for Visitors
  try {
    const testEmail = `lead_${Date.now()}@innovate.com`;
    const res = await fetch(`${BASE_URL}/api/internal/sandbox/create-key`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyName: "Fintech Innovations Lab",
        contactPerson: "Arjun Kapoor",
        email: testEmail,
        phone: "+91 98112 23344",
      }),
    });
    const json = await res.json();
    if (res.status === 200 && json.success && json.apiKey?.startsWith("cd_test_")) {
      console.log("✅ TEST 5 PASSED: Instant Sandbox Lead generated with pre-credited trial wallet.");
      console.log("   Generated Key:", json.apiKey);
      console.log("   Trial Balance: ₹" + json.trialBalance);
      passed++;
    } else {
      console.error("❌ TEST 5 FAILED:", res.status, json);
      failed++;
    }
  } catch (err) {
    console.error("❌ TEST 5 EXCEPTION:", err);
    failed++;
  }

  // Test 6: Verify Admin KPI Stats Updated
  try {
    const res = await fetch(`${BASE_URL}/api/internal/admin/stats`);
    const json = await res.json();
    if (res.status === 200 && json.summary?.totalHits > 0) {
      console.log("✅ TEST 6 PASSED: Super Admin Stats reflected real-time hit counters and revenue.");
      console.log("   Total Hits:", json.summary.totalHits);
      console.log("   Gross Sales: ₹" + json.summary.grossRevenue);
      console.log("   Net Margin: ₹" + json.summary.netProfitMargin);
      passed++;
    } else {
      console.error("❌ TEST 6 FAILED:", res.status, json);
      failed++;
    }
  } catch (err) {
    console.error("❌ TEST 6 EXCEPTION:", err);
    failed++;
  }

  // Test 7: Verify PAN Report Table has recorded the hit
  try {
    const res = await fetch(`${BASE_URL}/api/internal/admin/reports/pan?pan=AAACA5678B`);
    const json = await res.json();
    if (res.status === 200 && json.reports && json.reports.length > 0) {
      console.log("✅ TEST 7 PASSED: Specialized PAN Report recorded the audit record.");
      console.log("   Records matching PAN:", json.reports.length);
      passed++;
    } else {
      console.error("❌ TEST 7 FAILED:", res.status, json);
      failed++;
    }
  } catch (err) {
    console.error("❌ TEST 7 EXCEPTION:", err);
    failed++;
  }

  console.log("=================================================");
  console.log(`🎉 TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log("=================================================");
  if (failed > 0) process.exit(1);
}

runVerification();
