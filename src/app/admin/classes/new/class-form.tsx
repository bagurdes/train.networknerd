"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormError } from "@/components/ui/form-error";
import {
  createClassAction,
  updateClassAction,
  type FormState,
} from "@/features/classes/actions";

interface Course {
  id: string;
  title: string;
}

interface ClassFormValues {
  name: string;
  courseId: string;
  startDate: string;
  endDate: string;
  capacity: number;
}

const initialState: FormState = {};

type Props =
  | { mode: "create"; courses: Course[]; id?: never; initialValues?: never }
  | { mode: "edit"; courses: Course[]; id: string; initialValues: ClassFormValues };

export function ClassForm(props: Props) {
  const action =
    props.mode === "create"
      ? createClassAction
      : updateClassAction.bind(null, props.id);

  const [state, formAction] = useActionState(action, initialState);
  const iv = props.mode === "edit" ? props.initialValues : null;

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Class name</Label>
        <Input
          id="name"
          name="name"
          defaultValue={iv?.name ?? ""}
          placeholder="Spring 2026 — Wireshark 101"
          required
        />
        <FormError>{state.fieldErrors?.name?.[0]}</FormError>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="courseId">Course</Label>
        <select
          id="courseId"
          name="courseId"
          defaultValue={iv?.courseId ?? ""}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          required
        >
          <option value="">Select a course…</option>
          {props.courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
        <FormError>{state.fieldErrors?.courseId?.[0]}</FormError>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="startDate">Start date</Label>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            defaultValue={iv?.startDate?.slice(0, 10) ?? ""}
            required
          />
          <FormError>{state.fieldErrors?.startDate?.[0]}</FormError>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="endDate">End date (optional)</Label>
          <Input
            id="endDate"
            name="endDate"
            type="date"
            defaultValue={iv?.endDate?.slice(0, 10) ?? ""}
          />
          <FormError>{state.fieldErrors?.endDate?.[0]}</FormError>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="capacity">Max students</Label>
        <Input
          id="capacity"
          name="capacity"
          type="number"
          min={1}
          max={100}
          defaultValue={iv?.capacity ?? 30}
          required
        />
        <FormError>{state.fieldErrors?.capacity?.[0]}</FormError>
      </div>

      <FormError>{state.error}</FormError>

      <div className="flex justify-end">
        <SubmitButton pendingText="Saving…">
          {props.mode === "create" ? "Create class" : "Save changes"}
        </SubmitButton>
      </div>
    </form>
  );
}
