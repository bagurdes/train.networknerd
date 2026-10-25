"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormError } from "@/components/ui/form-error";
import { joinClassAction, type FormState } from "@/features/classes/actions";

const initial: FormState = {};

/**
 * Join a class with a code. With `code` set (the /join/[code] page) it's a
 * single button; without it (the dashboard) the student types the code.
 */
export function JoinClassForm({ code, buttonText = "Join class" }: { code?: string; buttonText?: string }) {
  const [state, action] = useActionState(joinClassAction, initial);

  return (
    <form action={action} className="space-y-3">
      {code ? (
        <input type="hidden" name="code" value={code} />
      ) : (
        <div className="space-y-1.5">
          <Label htmlFor="code">Join code</Label>
          <Input
            id="code"
            name="code"
            placeholder="ABCD-2345"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            className="font-mono uppercase tracking-wider"
          />
          <FormError>{state.fieldErrors?.code?.[0]}</FormError>
        </div>
      )}
      <FormError>{state.error}</FormError>
      <SubmitButton className={code ? "w-full" : undefined} pendingText="Joining…">
        {buttonText}
      </SubmitButton>
    </form>
  );
}
