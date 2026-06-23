"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormError } from "@/components/ui/form-error";
import {
  createQuestionAction,
  updateQuestionAction,
  type FormState,
} from "@/features/questions/actions";

interface QuestionFormValues {
  prompt: string;
  correctAnswer: string;
  explanation: string;
  hint: string;
  order: number;
}

const initialState: FormState = {};

type Props =
  | {
      mode: "create";
      moduleId: string;
      courseId: string;
      defaultOrder: number;
      id?: never;
      initialValues?: never;
    }
  | {
      mode: "edit";
      moduleId: string;
      courseId: string;
      id: string;
      initialValues: QuestionFormValues;
      defaultOrder?: never;
    };

export function QuestionForm(props: Props) {
  const action =
    props.mode === "create"
      ? createQuestionAction.bind(null, props.moduleId, props.courseId)
      : updateQuestionAction.bind(null, props.id, props.moduleId, props.courseId);

  const [state, formAction] = useActionState(action, initialState);

  const defaultOrder = props.mode === "create" ? props.defaultOrder : props.initialValues.order;
  const iv = props.mode === "edit" ? props.initialValues : null;

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="prompt">Question</Label>
        <Textarea
          id="prompt"
          name="prompt"
          rows={4}
          defaultValue={iv?.prompt ?? ""}
          placeholder="What does the TCP SYN flag indicate?"
          required
        />
        <FormError>{state.fieldErrors?.prompt?.[0]}</FormError>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="correctAnswer">Correct answer</Label>
        <Textarea
          id="correctAnswer"
          name="correctAnswer"
          rows={3}
          defaultValue={iv?.correctAnswer ?? ""}
          placeholder="The SYN flag is used to initiate a TCP connection…"
          required
        />
        <p className="text-xs text-muted-foreground">
          The reference answer Claude uses when grading student responses.
        </p>
        <FormError>{state.fieldErrors?.correctAnswer?.[0]}</FormError>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="hint">Hint (optional)</Label>
        <Textarea
          id="hint"
          name="hint"
          rows={2}
          defaultValue={iv?.hint ?? ""}
          placeholder="Look in the Packet Details pane…"
        />
        <p className="text-xs text-muted-foreground">
          Shown to students before they submit if they ask for a hint.
        </p>
        <FormError>{state.fieldErrors?.hint?.[0]}</FormError>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="explanation">Explanation</Label>
        <Textarea
          id="explanation"
          name="explanation"
          rows={4}
          defaultValue={iv?.explanation ?? ""}
          placeholder="SYN stands for synchronize. When a client wants to connect…"
        />
        <p className="text-xs text-muted-foreground">
          Shown to students after they submit their answer.
        </p>
        <FormError>{state.fieldErrors?.explanation?.[0]}</FormError>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="order">Order</Label>
        <Input
          id="order"
          name="order"
          type="number"
          min={1}
          defaultValue={defaultOrder}
          required
        />
        <FormError>{state.fieldErrors?.order?.[0]}</FormError>
      </div>

      <FormError>{state.error}</FormError>

      <div className="flex justify-end">
        <SubmitButton pendingText="Saving…">
          {props.mode === "create" ? "Create question" : "Save changes"}
        </SubmitButton>
      </div>
    </form>
  );
}
