"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormError } from "@/components/ui/form-error";
import { addMembersAction, type FormState } from "@/features/classes/actions";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  alreadyEnrolled: boolean;
}

const initialState: FormState = {};

export function AddMembersForm({
  classId,
  users,
}: {
  classId: string;
  users: User[];
}) {
  const action = addMembersAction.bind(null, classId);
  const [state, formAction] = useActionState(action, initialState);

  const available = users.filter((u) => !u.alreadyEnrolled);
  const enrolled = users.filter((u) => u.alreadyEnrolled);

  return (
    <form action={formAction} className="space-y-3">
      <div className="space-y-1">
        {users.length === 0 && (
          <p className="text-sm text-muted-foreground">No users available.</p>
        )}

        {enrolled.map((u) => (
          <label
            key={u.id}
            className="flex items-center gap-3 rounded-md px-2 py-1.5 opacity-50 cursor-not-allowed"
          >
            <input
              type="checkbox"
              checked
              disabled
              className="h-4 w-4 rounded border-border"
            />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium">{u.name}</span>
              <span className="text-xs text-muted-foreground ml-2">{u.email}</span>
            </div>
            <span className="text-xs text-muted-foreground shrink-0">enrolled</span>
          </label>
        ))}

        {available.map((u) => (
          <label
            key={u.id}
            className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted cursor-pointer"
          >
            <input
              type="checkbox"
              name="userIds"
              value={u.id}
              className="h-4 w-4 rounded border-border"
            />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium">{u.name}</span>
              <span className="text-xs text-muted-foreground ml-2">{u.email}</span>
            </div>
            <span className="text-xs text-muted-foreground shrink-0">{u.role.toLowerCase()}</span>
          </label>
        ))}
      </div>

      {state.ok && (
        <p className="text-sm text-green-600">
          {state.error ?? "Members added successfully."}
        </p>
      )}
      {!state.ok && <FormError>{state.error}</FormError>}

      {available.length > 0 && (
        <SubmitButton pendingText="Adding…">Add selected as students</SubmitButton>
      )}
    </form>
  );
}
