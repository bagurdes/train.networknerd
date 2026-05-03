"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormError, FormSuccess } from "@/components/ui/form-error";
import { confirmResetAction, type FormState } from "@/features/auth/actions";

const initial: FormState = {};

export function ConfirmResetForm({ token }: { token: string }) {
  const [state, action] = useActionState(confirmResetAction, initial);

  if (state.ok) {
    return (
      <div className="space-y-3">
        <FormSuccess>Password updated.</FormSuccess>
        <Link href="/login" className="text-sm text-primary hover:underline">
          Log in with your new password
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />

      <div className="space-y-1.5">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={10}
          required
        />
        <FormError>{state.fieldErrors?.password?.[0]}</FormError>
      </div>

      <FormError>{state.error}</FormError>

      <SubmitButton className="w-full" pendingText="Updating…">
        Update password
      </SubmitButton>
    </form>
  );
}
