"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormError } from "@/components/ui/form-error";
import {
  updateStandaloneModuleAction,
  type FormState,
} from "@/features/modules/actions";

interface Values {
  title: string;
  description: string;
  isPublic: boolean;
  slug: string;
}

const initialState: FormState = {};

export function StandaloneModuleForm({
  id,
  initialValues,
}: {
  id: string;
  initialValues: Values;
}) {
  const action = updateStandaloneModuleAction.bind(null, id);
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" defaultValue={initialValues.title} required />
        <FormError>{state.fieldErrors?.title?.[0]}</FormError>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={initialValues.description}
          required
        />
        <FormError>{state.fieldErrors?.description?.[0]}</FormError>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="slug">Demo URL slug (optional)</Label>
        <Input
          id="slug"
          name="slug"
          defaultValue={initialValues.slug}
          placeholder="NAT"
        />
        <p className="text-xs text-muted-foreground">
          Friendly URL for demo mode: /demo/&lt;slug&gt;. Letters, numbers, and dashes only.
        </p>
        <FormError>{state.fieldErrors?.slug?.[0]}</FormError>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isPublic"
          name="isPublic"
          value="true"
          defaultChecked={initialValues.isPublic}
          className="h-4 w-4 rounded border-border"
        />
        <Label htmlFor="isPublic">Public demo module (accessible without login)</Label>
      </div>

      {state.ok && <p className="text-sm text-green-600">Saved.</p>}
      <FormError>{state.error}</FormError>

      <div className="flex justify-end">
        <SubmitButton pendingText="Saving…">Save changes</SubmitButton>
      </div>
    </form>
  );
}
