"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { Role } from "@prisma/client";
import { requireRole } from "@/lib/authorize";
import { AppError } from "@/lib/errors";
import { createQuestionSchema, updateQuestionSchema } from "./schema";
import {
  createQuestion,
  deleteQuestion,
  getNextQuestionOrder,
  reorderQuestions,
  updateQuestion,
} from "./service";

export interface FormState {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

/**
 * Where to send the admin back after a save/delete. If the request came from
 * a course-scoped page, we keep them in that course's context; otherwise we
 * send them to the module-scoped page (used by copies and standalone modules).
 */
function questionsListPath(moduleId: string, courseId: string | null): string {
  return courseId
    ? `/admin/courses/${courseId}/modules/${moduleId}/questions`
    : `/admin/modules/${moduleId}/questions`;
}

export async function createQuestionAction(
  moduleId: string,
  courseId: string | null,
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
      hint: formData.get("hint"),
      graderNotes: formData.get("graderNotes"),
      order: formData.get("order") || String(nextOrder),
    });
    await createQuestion(moduleId, input);
    const dest = questionsListPath(moduleId, courseId);
    revalidatePath(dest);
    redirect(dest);
  } catch (err) {
    return toFormState(err);
  }
}

export async function updateQuestionAction(
  id: string,
  moduleId: string,
  courseId: string | null,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    await requireRole([Role.ADMIN]);
    const input = updateQuestionSchema.parse({
      prompt: formData.get("prompt"),
      correctAnswer: formData.get("correctAnswer"),
      explanation: formData.get("explanation"),
      hint: formData.get("hint"),
      graderNotes: formData.get("graderNotes"),
      order: formData.get("order"),
    });
    await updateQuestion(id, input);
    const dest = questionsListPath(moduleId, courseId);
    revalidatePath(dest);
    redirect(dest);
  } catch (err) {
    return toFormState(err);
  }
}

export async function deleteQuestionAction(
  id: string,
  moduleId: string,
  courseId: string | null,
): Promise<void> {
  await requireRole([Role.ADMIN]);
  await deleteQuestion(id);
  const dest = questionsListPath(moduleId, courseId);
  revalidatePath(dest);
  redirect(dest);
}

/**
 * Persist a drag-and-drop reorder. Returns a small ok/error object (NOT a
 * redirect) so the client can roll back the optimistic UI on failure.
 */
export async function reorderQuestionsAction(
  moduleId: string,
  courseId: string | null,
  orderedIds: string[],
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireRole([Role.ADMIN]);
    await reorderQuestions(moduleId, orderedIds);
    revalidatePath(questionsListPath(moduleId, courseId));
    return { ok: true };
  } catch (err) {
    if (err instanceof AppError) return { ok: false, error: err.message };
    console.error("[questions.actions] reorder:", err);
    return { ok: false, error: "Could not reorder questions" };
  }
}

function toFormState(err: unknown): FormState {
  if (err instanceof ZodError) return { fieldErrors: err.flatten().fieldErrors };
  if (err instanceof AppError) return { error: err.message };
  if (err && typeof err === "object" && "digest" in err) throw err;
  console.error("[questions.actions] Unhandled:", err);
  return { error: "Something went wrong. Please try again." };
}
