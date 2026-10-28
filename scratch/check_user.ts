import { db } from "../src/lib/db";

async function main() {
  const users = await db.user.findMany({
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      accountStatus: true,
      passwordHash: true,
      createdAt: true,
    },
  });
  console.log("USERS_LIST:", JSON.stringify(users, null, 2));
}

main().finally(() => db.$disconnect());
