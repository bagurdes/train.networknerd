"use client";

import { useActionState } from "react";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormError } from "@/components/ui/form-error";
import { addMemberAction, type FormState } from "@/features/classes/actions";

interface User {
  id: string;
  name: string;
  email: string;
}

const initialState: FormState = {};

export function AddMemberForm({
  classId,
  users,
}: {
  classId: string;
  users: User[];
}) {
  const action = addMemberAction.bind(null, classId);
  const [state, formAction] = useActionState(action, initialState);

  if (users.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        All users are already members of this class.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="userId">User</Label>
        <select
          id="userId"
          name="userId"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          required
        >
          <option value="">Select a user…</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} ({u.email})
            </option>
          ))}
        </select>
        <FormError>{state.fieldErrors?.userId?.[0]}</FormError>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="role">Role in class</Label>
        <select
          id="role"
          name="role"
          defaultValue="STUDENT"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          required
        >
          <option value="STUDENT">Student</option>
          <option value="INSTRUCTOR">Instructor</option>
        </select>
        <FormError>{state.fieldErrors?.role?.[0]}</FormError>
      </div>

      {state.ok && (
        <p className="text-sm text-green-600">Member added successfully.</p>
      )}
      <FormError>{state.error}</FormError>

      <SubmitButton pendingText="Adding…">Add to class</SubmitButton>
    </form>
  );
}
