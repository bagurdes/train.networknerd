import { z } from "zod";

/**
 * Zod-validated environment variables.
 *
 * Importing `env` from this module is the ONLY supported way to read env vars.
 * If anything is missing or malformed, the process refuses to start with a
 * clear error — far better than silent `undefined` deep in business logic.
 *
 * This module is Edge-safe (no Node-only imports), so it can be imported by
 * middleware as well as route handlers and server components.
 */
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // Database
  DATABASE_URL: z.string().url(),

  // Auth.js
  NEXTAUTH_SECRET: z.string().min(32, "NEXTAUTH_SECRET must be at least 32 chars (try `openssl rand -base64 32`)"),
  NEXTAUTH_URL: z.string().url(),

  // Anthropic
  ANTHROPIC_API_KEY: z.string().min(1),
  ANTHROPIC_GRADING_MODEL: z.string().default("claude-haiku-4-5-20251001"),

  // Email (Resend)
  RESEND_API_KEY: z.string().min(1),
  EMAIL_FROM: z.string().min(1),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  // Pretty-print the failures so the developer knows exactly what to fix.
  // eslint-disable-next-line no-console
  console.error(
    "\n❌ Invalid environment variables:\n",
    JSON.stringify(parsed.error.flatten().fieldErrors, null, 2),
    "\n\nCheck .env.local against .env.example.\n",
  );
  throw new Error("Invalid environment variables. See log above.");
}

export const env = parsed.data;
export type Env = typeof env;
