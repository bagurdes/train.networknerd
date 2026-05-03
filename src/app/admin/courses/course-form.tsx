"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormError } from "@/components/ui/form-error";
import {
  createCourseAction,
  updateCourseAction,
  type FormState,
} from "@/features/courses/actions";

/**
 * Shared course form — used for both create and edit.
 *
 * The same inputs and validation rules apply in both modes; only the action
 * differs. This is the reference pattern for the rest of the admin CRUD forms.
 */

interface CourseFormValues {
  title: string;
  description: string;
  downloadUrl: string;
}

const empty: CourseFormValues = { title: "", description: "", downloadUrl: "" };
const initialState: FormState = {};

type Props =
  | { mode: "create"; id?: never; initialValues?: never }
  | { mode: "edit"; id: string; initialValues: CourseFormValues };

export function CourseForm(props: Props) {
  // Bind the course id into the update action — the action signature is
  // (id, prevState, formData), and useActionState only knows about the last two.
  const action =
    props.mode === "create"
      ? createCourseAction
      : updateCourseAction.bind(null, props.id);

  const [state, formAction] = useActionState(action, initialState);
  const values = props.mode === "edit" ? props.initialValues : empty;

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" defaultValue={values.title} required />
        <FormError>{state.fieldErrors?.title?.[0]}</FormError>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={5}
          defaultValue={values.description}
          required
        />
        <p className="text-xs text-muted-foreground">
          Shown to students on their dashboard.
        </p>
        <FormError>{state.fieldErrors?.description?.[0]}</FormError>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="downloadUrl">Download link (optional)</Label>
        <Input
          id="downloadUrl"
          name="downloadUrl"
          type="url"
          placeholder="https://…"
          defaultValue={values.downloadUrl}
        />
        <p className="text-xs text-muted-foreground">
          Link to course materials, if any. Must start with http:// or https://.
        </p>
        <FormError>{state.fieldErrors?.downloadUrl?.[0]}</FormError>
      </div>

      <FormError>{state.error}</FormError>

      <div className="flex justify-end">
        <SubmitButton pendingText="Saving…">
          {props.mode === "create" ? "Create course" : "Save changes"}
        </SubmitButton>
      </div>
    </form>
  );
}
