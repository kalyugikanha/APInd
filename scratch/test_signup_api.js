async function testSignup() {
  const testEmail = `testuser_${Date.now()}@example.com`;
  console.log(`Testing POST /api/internal/auth/signup with email: ${testEmail}...`);
  
  const startTime = Date.now();
  const res = await fetch("http://localhost:3000/api/internal/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      companyName: "Selfup Community",
      contactPerson: "Akash",
      email: testEmail,
      password: "password12345",
    }),
  });

  const latency = Date.now() - startTime;
  const json = await res.json();
  console.log(`Status: ${res.status} (${latency}ms)`);
  console.log("Response:", JSON.stringify(json, null, 2));

  if (!res.ok || !json.success) {
    console.error("FAILED signup test!");
    process.exit(1);
  } else {
    console.log("SUCCESS! Client onboarded in", latency, "ms");
  }
}

testSignup().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
