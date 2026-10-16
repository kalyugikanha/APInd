/**
 * One-off provisioning of the first enterprise client: Selfup Community.
 * Calls the real admin onboarding route handler (same code path as the Admin UI).
 *
 * Usage: npx tsx scripts/provision-selfup.ts
 * Keys are shown ONCE; only SHA-256 hashes are stored in the DB.
 * Output is also saved to .credentials/selfup.json (gitignored).
 */
import fs from "fs";
import path from "path";
import { NextRequest } from "next/server";
import { POST } from "../src/app/api/internal/admin/clients/route";

const SELFUP = {
  companyName: "Selfup Community",
  brandName: "Selfup",
  fullName: "Selfup Admin",
  email: process.env.SELFUP_EMAIL || "tech@selfup.community",
  phone: "",
  password: process.env.SELFUP_PASSWORD || "Selfup@12345",
  businessType: "PVT_LTD",
  billingModel: "PREPAID",
  initialBalance: Number(process.env.SELFUP_BALANCE || 500),
  allowedIps: ["*"],
};

async function main() {
  const req = new NextRequest("http://localhost:3000/api/internal/admin/clients", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(SELFUP),
  });
  const res = await POST(req);
  const data = await res.json();

  if (!res.ok) {
    console.error(`❌ ${res.status}: ${data.error}`);
    if (res.status === 409) console.error("Selfup already exists. Keys can't be re-shown; rotate them from Admin → Clients.");
    process.exit(1);
  }

  const out = {
    clientCode: data.client.clientCode,
    login: { email: SELFUP.email, password: SELFUP.password },
    walletBalance: data.client.walletBalance,
    productionApiKey: data.client.productionApiKey,
    sandboxApiKey: data.client.sandboxApiKey,
  };

  const dir = path.join(process.cwd(), ".credentials");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "selfup.json"), JSON.stringify(out, null, 2));

  console.log(JSON.stringify(out, null, 2));
  console.log("\n✅ Saved to .credentials/selfup.json (gitignored)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
