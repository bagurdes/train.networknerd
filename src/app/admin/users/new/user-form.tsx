"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormError } from "@/components/ui/form-error";
import {
  createUserAction,
  updateUserAction,
  type FormState,
} from "@/features/users/actions";

const initialState: FormState = {};

type Props =
  | { mode: "create"; id?: never; initialValues?: never }
  | { mode: "edit"; id: string; initialValues: { name: string; role: string } };

export function UserForm(props: Props) {
  const action =
    props.mode === "create"
      ? createUserAction
      : updateUserAction.bind(null, props.id);

  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Full name</Label>
        <Input
          id="name"
          name="name"
          defaultValue={props.mode === "edit" ? props.initialValues.name : ""}
          required
        />
        <FormError>{state.fieldErrors?.name?.[0]}</FormError>
      </div>

      {props.mode === "create" && (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
            <FormError>{state.fieldErrors?.email?.[0]}</FormError>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required minLength={8} />
            <p className="text-xs text-muted-foreground">Minimum 8 characters.</p>
            <FormError>{state.fieldErrors?.password?.[0]}</FormError>
          </div>
        </>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="role">Role</Label>
        <select
          id="role"
          name="role"
          defaultValue={props.mode === "edit" ? props.initialValues.role : "STUDENT"}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          required
        >
          <option value="STUDENT">Student</option>
          <option value="INSTRUCTOR">Instructor</option>
          <option value="ADMIN">Admin</option>
        </select>
        <FormError>{state.fieldErrors?.role?.[0]}</FormError>
      </div>

      <FormError>{state.error}</FormError>

      <div className="flex justify-end">
        <SubmitButton pendingText="Saving…">
          {props.mode === "create" ? "Create user" : "Save changes"}
        </SubmitButton>
      </div>
    </form>
  );
}
