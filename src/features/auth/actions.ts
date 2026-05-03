"use server";

import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { signIn, signOut } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import {
  confirmResetSchema,
  loginSchema,
  registerSchema,
  requestResetSchema,
} from "./schema";
import {
  confirmPasswordReset,
  registerStudent,
  requestPasswordReset,
} from "./service";

/**
 * Server actions for the auth feature.
 *
 * Each action returns a small `FormState` shape consumed by `useActionState`
 * on the client. Successful actions either redirect or return `{ ok: true }`.
 *
 * Actions deliberately do NOT throw — exceptions bubble up to React's error
 * boundary and feel jarring on a login form. We translate to a friendly
 * `error` field instead.
 */

export interface FormState {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

const empty: FormState = {};

// ---- Register --------------------------------------------------------------

export async function registerAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    const input = registerSchema.parse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
    });
    await registerStudent(input);
    // Auto-login on successful registration.
    await signIn("credentials", {
      email: input.email,
      password: input.password,
      redirectTo: "/dashboard",
    });
    return { ok: true };
  } catch (err) {
    return toFormState(err);
  }
}

// ---- Login -----------------------------------------------------------------

export async function loginAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    const input = loginSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });
    await signIn("credentials", {
      email: input.email,
      password: input.password,
      redirectTo: "/dashboard",
    });
    return { ok: true };
  } catch (err) {
    // Auth.js throws a CredentialsSignin error on bad credentials. Treat all
    // sign-in errors as "invalid email or password" to avoid enumeration.
    if (
      err &&
      typeof err === "object" &&
      "type" in err &&
      err.type === "CredentialsSignin"
    ) {
      return { error: "Invalid email or password" };
    }
    return toFormState(err);
  }
}

// ---- Logout ----------------------------------------------------------------

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/" });
  redirect("/");
}

// ---- Request reset ---------------------------------------------------------

export async function requestResetAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    const input = requestResetSchema.parse({ email: formData.get("email") });
    await requestPasswordReset(input);
    return { ok: true };
  } catch (err) {
    return toFormState(err);
  }
}

// ---- Confirm reset ---------------------------------------------------------

export async function confirmResetAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    const input = confirmResetSchema.parse({
      token: formData.get("token"),
      password: formData.get("password"),
    });
    await confirmPasswordReset(input);
    return { ok: true };
  } catch (err) {
    return toFormState(err);
  }
}

// ---------------------------------------------------------------------------

function toFormState(err: unknown): FormState {
  void empty;
  if (err instanceof ZodError) {
    return { fieldErrors: err.flatten().fieldErrors };
  }
  if (err instanceof AppError) {
    return { error: err.message };
  }
  // Re-throw redirect signals from Next.js — these are the framework's way
  // of saying "we already redirected".
  if (err && typeof err === "object" && "digest" in err) throw err;
  // eslint-disable-next-line no-console
  console.error("[auth.actions] Unhandled:", err);
  return { error: "Something went wrong. Please try again." };
}
