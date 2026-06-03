import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url(),
  ANTHROPIC_API_KEY: z.string().min(1),
  ANTHROPIC_GRADING_MODEL: z.string().default("claude-haiku-4-5-20251001"),
  RESEND_API_KEY: z.string().min(1),
  EMAIL_FROM: z.string().min(1),
});

const isBuild = process.env.NEXT_PHASE === "phase-production-build";

const parsed = isBuild
  ? schema.safeParse({
      NODE_ENV: process.env.NODE_ENV ?? "production",
      DATABASE_URL: "postgresql://build:build@localhost:5432/build",
      NEXTAUTH_SECRET: "build-time-placeholder-secret-32chars!!",
      NEXTAUTH_URL: "http://localhost:3000",
      ANTHROPIC_API_KEY: "build-placeholder",
      ANTHROPIC_GRADING_MODEL: "claude-haiku-4-5-20251001",
      RESEND_API_KEY: "build-placeholder",
      EMAIL_FROM: "build@placeholder.com",
    })
  : schema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "\n❌ Invalid environment variables:\n",
    JSON.stringify(parsed.error.flatten().fieldErrors, null, 2),
    "\n\nCheck .env.local against .env.example.\n",
  );
  throw new Error("Invalid environment variables. See log above.");
}

export const env = parsed.data;
export type Env = typeof env;
