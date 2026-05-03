"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormError } from "@/components/ui/form-error";
import { registerAction, type FormState } from "@/features/auth/actions";

const initial: FormState = {};

export function RegisterForm() {
  const [state, action] = useActionState(registerAction, initial);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" autoComplete="name" required />
        <FormError>{state.fieldErrors?.name?.[0]}</FormError>
      </div>

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
          autoComplete="new-password"
          minLength={10}
          required
        />
        <p className="text-xs text-muted-foreground">At least 10 characters.</p>
        <FormError>{state.fieldErrors?.password?.[0]}</FormError>
      </div>

      <FormError>{state.error}</FormError>

      <SubmitButton className="w-full" pendingText="Creating your account…">
        Create account
      </SubmitButton>
    </form>
  );
}
