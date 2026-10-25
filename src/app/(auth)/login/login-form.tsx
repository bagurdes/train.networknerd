"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormError } from "@/components/ui/form-error";
import { loginAction, type FormState } from "@/features/auth/actions";

const initial: FormState = {};

export function LoginForm() {
  const [state, action] = useActionState(loginAction, initial);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
        <FormError>{state.fieldErrors?.email?.[0]}</FormError>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
        <FormError>{state.fieldErrors?.password?.[0]}</FormError>
      </div>

      <FormError>{state.error}</FormError>

      <SubmitButton className="w-full" pendingText="Logging in…">
        Log in
      </SubmitButton>
    </form>
  );
}
