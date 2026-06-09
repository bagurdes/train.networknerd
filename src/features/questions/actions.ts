"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { Role } from "@prisma/client";
import { requireRole } from "@/lib/authorize";
import { AppError } from "@/lib/errors";
import { createQuestionSchema, updateQuestionSchema } from "./schema";
import { createQuestion, deleteQuestion, getNextQuestionOrder, updateQuestion } from "./service";

export interface FormState {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

export async function createQuestionAction(
  moduleId: string,
  courseId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    await requireRole([Role.ADMIN]);
    const nextOrder = await getNextQuestionOrder(moduleId);
    const input = createQuestionSchema.parse({
      prompt: formData.get("prompt"),
      correctAnswer: formData.get("correctAnswer"),
      explanation: formData.get("explanation"),
      order: formData.get("order") || String(nextOrder),
    });
    await createQuestion(moduleId, input);
    revalidatePath(`/admin/courses/${courseId}`);
    redirect(`/admin/courses/${courseId}`);
  } catch (err) {
    return toFormState(err);
  }
}

export async function updateQuestionAction(
  id: string,
  moduleId: string,
  courseId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    await requireRole([Role.ADMIN]);
    const input = updateQuestionSchema.parse({
      prompt: formData.get("prompt"),
      correctAnswer: formData.get("correctAnswer"),
      explanation: formData.get("explanation"),
      order: formData.get("order"),
    });
    await updateQuestion(id, input);
    revalidatePath(`/admin/courses/${courseId}`);
    redirect(`/admin/courses/${courseId}`);
  } catch (err) {
    return toFormState(err);
  }
}

export async function deleteQuestionAction(
  id: string,
  moduleId: string,
  courseId: string,
): Promise<void> {
  await requireRole([Role.ADMIN]);
  await deleteQuestion(id);
  revalidatePath(`/admin/courses/${courseId}`);
  redirect(`/admin/courses/${courseId}`);
}

function toFormState(err: unknown): FormState {
  if (err instanceof ZodError) return { fieldErrors: err.flatten().fieldErrors };
  if (err instanceof AppError) return { error: err.message };
  if (err && typeof err === "object" && "digest" in err) throw err;
  console.error("[questions.actions] Unhandled:", err);
  return { error: "Something went wrong. Please try again." };
}
