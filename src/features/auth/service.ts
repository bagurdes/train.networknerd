import { randomBytes, createHash } from "node:crypto";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { sendPasswordResetEmail, sendVerificationEmail } from "@/lib/email";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { hashPassword } from "./hash";
import type {
  ConfirmResetInput,
  RegisterInput,
  RequestResetInput,
} from "./schema";

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;        // 30 minutes
const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;  // 24 hours

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

/**
 * Register a new student account. Creates the user with emailVerified = null
 * and sends a verification email. The account cannot be used until the link
 * in the email is clicked.
 */
export async function registerStudent(input: RegisterInput) {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (existing) {
    throw new ConflictError("An account with that email already exists");
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      role: Role.STUDENT,
      // emailVerified intentionally left null until they click the link
    },
    select: { id: true, email: true, name: true, role: true },
  });

  // Generate verification token
  const token = randomBytes(32).toString("base64url");
  const tokenHash = sha256(token);
  const expiresAt = new Date(Date.now() + VERIFY_TOKEN_TTL_MS);

  await prisma.emailVerificationToken.create({
    data: { userId: user.id, tokenHash, expiresAt },
  });

  const verifyUrl = `${env.NEXTAUTH_URL.replace(/\/$/, "")}/verify-email/${token}`;
  await sendVerificationEmail({ to: user.email, name: user.name, verifyUrl });

  return user;
}

// ---------------------------------------------------------------------------
// Email verification
// ---------------------------------------------------------------------------

/**
 * Verify an email address using the token from the verification link.
 * Sets emailVerified and deletes the token.
 */
export async function verifyEmail(token: string): Promise<{ name: string; email: string }> {
  const tokenHash = sha256(token);
  const record = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!record || record.usedAt) {
    throw new ValidationError("This verification link is invalid or has already been used");
  }
  if (record.expiresAt.getTime() < Date.now()) {
    throw new ValidationError("This verification link has expired. Please register again.");
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { emailVerified: new Date() },
    }),
    prisma.emailVerificationToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return { name: record.user.name, email: record.user.email };
}

// ---------------------------------------------------------------------------
// Password reset
// ---------------------------------------------------------------------------

export async function requestPasswordReset(input: RequestResetInput): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user) return;

  const token = randomBytes(32).toString("base64url");
  const tokenHash = sha256(token);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  await prisma.$transaction([
    prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    }),
    prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    }),
  ]);

  const resetUrl = `${env.NEXTAUTH_URL.replace(/\/$/, "")}/reset/${token}`;
  await sendPasswordResetEmail({ to: user.email, name: user.name, resetUrl });
}

export async function confirmPasswordReset(input: ConfirmResetInput): Promise<void> {
  const tokenHash = sha256(input.token);
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!record || record.usedAt) {
    throw new ValidationError("This reset link is invalid or has already been used");
  }
  if (record.expiresAt.getTime() < Date.now()) {
    throw new ValidationError("This reset link has expired. Request a new one.");
  }

  const newHash = await hashPassword(input.password);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash: newHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    prisma.passwordResetToken.updateMany({
      where: { userId: record.userId, usedAt: null },
      data: { usedAt: new Date() },
    }),
  ]);
}

// ---------------------------------------------------------------------------
// Lookups
// ---------------------------------------------------------------------------

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });
  if (!user) throw new NotFoundError("User not found");
  return user;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}
