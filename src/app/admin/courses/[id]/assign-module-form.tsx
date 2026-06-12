"use client";

import { useActionState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormError } from "@/components/ui/form-error";
import { assignModuleAction, type FormState } from "@/features/modules/actions";

interface Module {
  id: string;
  title: string;
  _count: { questions: number };
}

const initialState: FormState = {};

export function AssignModuleForm({
  courseId,
  modules,
}: {
  courseId: string;
  modules: Module[];
}) {
  const action = assignModuleAction.bind(null, courseId);
  const [state, formAction] = useActionState(action, initialState);

  if (modules.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        All existing modules are already in this course.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="moduleId">Module</Label>
        <select
          id="moduleId"
          name="moduleId"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          required
        >
          <option value="">Select a module…</option>
          {modules.map((m) => (
            <option key={m.id} value={m.id}>
              {m.title} ({m._count.questions} questions)
            </option>
          ))}
        </select>
        <FormError>{state.fieldErrors?.moduleId?.[0]}</FormError>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="order">Position in course</Label>
        <Input id="order" name="order" type="number" min={1} placeholder="Auto" />
        <p className="text-xs text-muted-foreground">Leave blank to add at the end.</p>
        <FormError>{state.fieldErrors?.order?.[0]}</FormError>
      </div>

      {state.ok && (
        <p className="text-sm text-green-600">Module assigned successfully.</p>
      )}
      <FormError>{state.error}</FormError>

      <SubmitButton pendingText="Assigning…">Assign to course</SubmitButton>
    </form>
  );
}
