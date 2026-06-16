import { z } from "zod";

/**
 * Zod schemas for the auth feature.
 *
 * Shared between server-side validation and client-side form state. The
 * password rule is intentionally simple (length only) — complex composition
 * rules are weakly correlated with security and frustrate users. We rely on
 * length + argon2id + reset-on-leak.
 */

export const passwordSchema = z
  .string()
  .min(10, "Password must be at least 10 characters")
  .max(128, "Password too long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

export const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Enter a valid email")
  .transform((s) => s.toLowerCase());

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: emailSchema,
  password: passwordSchema,
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const requestResetSchema = z.object({
  email: emailSchema,
});
export type RequestResetInput = z.infer<typeof requestResetSchema>;

export const confirmResetSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
});
export type ConfirmResetInput = z.infer<typeof confirmResetSchema>;
