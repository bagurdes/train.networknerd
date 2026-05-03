import { randomBytes, createHash } from "node:crypto";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { sendPasswordResetEmail } from "@/lib/email";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { hashPassword } from "./hash";
import type {
  ConfirmResetInput,
  RegisterInput,
  RequestResetInput,
} from "./schema";

/**
 * Auth service — pure business logic, no HTTP, no UI.
 *
 * Server actions and route handlers wrap these functions; tests call them
 * directly.
 */

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

/**
 * Register a new student account. Self-service signup is for STUDENT only —
 * Admin and Instructor accounts are provisioned by an existing Admin.
 */
export async function registerStudent(input: RegisterInput) {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (existing) {
    // Don't leak which emails exist, but for self-registration we do tell the
    // user the address is taken — they would discover it on the next step.
    throw new ConflictError("An account with that email already exists");
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      role: Role.STUDENT,
    },
    select: { id: true, email: true, name: true, role: true },
  });

  return user;
}

// ---------------------------------------------------------------------------
// Password reset
// ---------------------------------------------------------------------------

/**
 * Start a password reset. Always succeeds from the caller's POV — we don't
 * leak whether the email is registered. If the user exists, we email them a
 * single-use, time-limited reset link.
 */
export async function requestPasswordReset(input: RequestResetInput): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    // Silent success — same response as the happy path.
    return;
  }

  // Generate a 32-byte URL-safe token; only the hash lives in the DB.
  const token = randomBytes(32).toString("base64url");
  const tokenHash = sha256(token);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  // Invalidate any unused tokens for this user before issuing a fresh one —
  // older request emails should stop working the moment a newer one is sent.
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

/**
 * Complete a password reset. Validates the token, replaces the password hash,
 * marks the token used, and invalidates any sibling unused tokens for safety.
 */
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
    // Burn any other outstanding tokens for this user.
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
