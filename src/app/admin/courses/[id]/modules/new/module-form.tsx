"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormError } from "@/components/ui/form-error";
import {
  createModuleAction,
  updateModuleAction,
  type FormState,
} from "@/features/modules/actions";

interface ModuleFormValues {
  title: string;
  description: string;
  isPublic: boolean;
}

const initialState: FormState = {};

type Props =
  | { mode: "create"; courseId: string; defaultOrder: number; id?: never; initialValues?: never }
  | { mode: "edit"; courseId: string; id: string; initialValues: ModuleFormValues; defaultOrder?: never };

export function ModuleForm(props: Props) {
  const action =
    props.mode === "create"
      ? createModuleAction.bind(null, props.courseId)
      : updateModuleAction.bind(null, props.id, props.courseId);

  const [state, formAction] = useActionState(action, initialState);

  const defaultTitle = props.mode === "edit" ? props.initialValues.title : "";
  const defaultDesc = props.mode === "edit" ? props.initialValues.description : "";

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" defaultValue={defaultTitle} required />
        <FormError>{state.fieldErrors?.title?.[0]}</FormError>
        </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isPublic"
          name="isPublic"
          value="true"
          defaultChecked={props.mode === "edit" ? props.initialValues.isPublic : false}
          className="h-4 w-4 rounded border-border"
        />
        <Label htmlFor="isPublic">Public demo module (accessible without login at /demo/[id])</Label>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={defaultDesc}
          required
        />
        <FormError>{state.fieldErrors?.description?.[0]}</FormError>
      </div>

      {/* Order is only relevant when creating — it sets the position in the course */}
      {props.mode === "create" && (
        <div className="space-y-1.5">
          <Label htmlFor="order">Position in course</Label>
          <Input
            id="order"
            name="order"
            type="number"
            min={1}
            defaultValue={props.defaultOrder}
          />
          <p className="text-xs text-muted-foreground">
            Modules are shown to students in this order.
          </p>
          <FormError>{state.fieldErrors?.order?.[0]}</FormError>
        </div>
      )}

      <FormError>{state.error}</FormError>

      <div className="flex justify-end">
        <SubmitButton pendingText="Saving…">
          {props.mode === "create" ? "Create module" : "Save changes"}
        </SubmitButton>
      </div>
    </form>
  );
}
