import { db } from "../src/lib/db";

async function main() {
  const user = await db.user.findFirst({ where: { email: "admin@colladome.com" } });
  console.log("ADMIN_USER_ID:", user?.id);
  const testUser = await db.user.findFirst({ where: { email: "test_client@colladome.com" } });
  console.log("TEST_USER_ID:", testUser?.id);
}

main().finally(() => db.$disconnect());
