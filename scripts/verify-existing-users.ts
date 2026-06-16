/**
 * scripts/verify-existing-users.ts
 *
 * One-time script: sets emailVerified = now() for all users who currently
 * have emailVerified = null. Run this BEFORE deploying the email verification
 * feature so that existing accounts are not locked out.
 *
 * Usage:
 *   npm run verify-existing-users
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.user.updateMany({
    where: { emailVerified: null },
    data: { emailVerified: new Date() },
  });
  console.log(`✅ Marked ${result.count} existing user(s) as verified.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
