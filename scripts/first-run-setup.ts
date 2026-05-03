/**
 * First-run setup — create the very first Admin user.
 *
 * Idempotent: refuses to run if an Admin already exists. Safe to leave in
 * production; it'll just no-op after the first successful run.
 *
 * Usage:
 *   1. Set FIRST_ADMIN_EMAIL and FIRST_ADMIN_NAME in your environment.
 *   2. `npm run first-run-setup`
 *   3. Open the printed reset URL and choose your password.
 *
 * The script never asks you to type a password into the terminal — instead it
 * issues a single-use password reset token, so the password is set the same
 * way every other reset works (audit-friendly, one happy path).
 */

import { randomBytes, createHash } from "node:crypto";
import { Role } from "@prisma/client";
import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/features/auth/hash";

const RESET_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24h for first-run only

async function main() {
  const email = process.env.FIRST_ADMIN_EMAIL?.toLowerCase().trim();
  const name = process.env.FIRST_ADMIN_NAME?.trim();
  const baseUrl = process.env.NEXTAUTH_URL?.replace(/\/$/, "");

  if (!email || !name || !baseUrl) {
    console.error(
      "❌ FIRST_ADMIN_EMAIL, FIRST_ADMIN_NAME, and NEXTAUTH_URL must be set.",
    );
    process.exit(1);
  }

  const existingAdmin = await prisma.user.findFirst({
    where: { role: Role.ADMIN },
    select: { id: true, email: true },
  });

  if (existingAdmin) {
    console.log(
      `ℹ️  An Admin already exists (${existingAdmin.email}). Nothing to do.`,
    );
    process.exit(0);
  }

  // Random throwaway password — the user sets a real one via the reset link.
  const tempPasswordHash = await hashPassword(randomBytes(48).toString("base64url"));

  const user = await prisma.user.upsert({
    where: { email },
    update: { role: Role.ADMIN, name },
    create: {
      email,
      name,
      role: Role.ADMIN,
      passwordHash: tempPasswordHash,
    },
    select: { id: true, email: true, name: true },
  });

  // Issue a fresh reset token for the new admin.
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    },
  });

  const resetUrl = `${baseUrl}/reset/${token}`;

  console.log("");
  console.log("✅ Admin account created.");
  console.log("");
  console.log(`   Email: ${user.email}`);
  console.log(`   Name:  ${user.name}`);
  console.log("");
  console.log("   Set your password by opening this link (valid 24 hours):");
  console.log("");
  console.log(`   ${resetUrl}`);
  console.log("");
}

main()
  .catch((err) => {
    console.error("❌ First-run setup failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
