"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormError, FormSuccess } from "@/components/ui/form-error";
import { requestResetAction, type FormState } from "@/features/auth/actions";

const initial: FormState = {};

export function RequestResetForm() {
  const [state, action] = useActionState(requestResetAction, initial);

  // Always show the same neutral confirmation regardless of whether the email
  // exists — protects against account enumeration.
  if (state.ok) {
    return (
      <FormSuccess>
        If an account exists for that email, we&rsquo;ve sent a reset link.
        Check your inbox and spam folder.
      </FormSuccess>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
        <FormError>{state.fieldErrors?.email?.[0]}</FormError>
      </div>

      <FormError>{state.error}</FormError>

      <SubmitButton className="w-full" pendingText="Sending…">
        Send reset link
      </SubmitButton>
    </form>
  );
}
