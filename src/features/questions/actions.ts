"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { Role } from "@prisma/client";
import { requireRole } from "@/lib/authorize";
import { AppError } from "@/lib/errors";
import { createQuestionSchema, updateQuestionSchema } from "./schema";
import {
  copyQuestions,
  createQuestion,
  deleteQuestion,
  getNextQuestionOrder,
  moveQuestions,
  reorderQuestions,
  updateQuestion,
} from "./service";
import { createStandaloneModule } from "@/features/modules/service";

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
 * Move or copy selected questions from a source module to a destination.
 * The destination is either an existing module id or a brand-new standalone
 * module created on the fly.
 */
export async function moveOrCopyQuestionsAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    await requireRole([Role.ADMIN]);

    const operation = formData.get("operation");
    const sourceModuleId = formData.get("sourceModuleId");
    const destinationKind = formData.get("destinationKind");
    const questionIds = formData.getAll("questionIds").filter((v): v is string => typeof v === "string");

    if (operation !== "move" && operation !== "copy") {
      return { error: "Invalid operation" };
    }
    if (typeof sourceModuleId !== "string" || !sourceModuleId) {
      return { error: "Source module missing" };
    }
    if (questionIds.length === 0) {
      return { error: "Select at least one question" };
    }

    let destinationModuleId: string;
    let destinationTitle: string | null = null;

    if (destinationKind === "new") {
      const title = (formData.get("newModuleTitle") as string | null)?.trim() ?? "";
      const description = (formData.get("newModuleDescription") as string | null)?.trim() ?? "";
      if (!title) return { fieldErrors: { newModuleTitle: ["New module title is required"] } };
      const newMod = await createStandaloneModule({ title, description });
      destinationModuleId = newMod.id;
      destinationTitle = newMod.title;
    } else if (destinationKind === "existing") {
      const existingId = formData.get("destinationModuleId");
      if (typeof existingId !== "string" || !existingId) {
        return { fieldErrors: { destinationModuleId: ["Choose a destination module"] } };
      }
      destinationModuleId = existingId;
    } else {
      return { error: "Choose a destination" };
    }

    if (operation === "move") {
      await moveQuestions(sourceModuleId, questionIds, destinationModuleId);
    } else {
      await copyQuestions(sourceModuleId, questionIds, destinationModuleId);
    }

    revalidatePath("/admin/utilities/move-questions");
    const params = new URLSearchParams({
      source: sourceModuleId,
      done: operation,
      dest: destinationModuleId,
      count: String(questionIds.length),
    });
    if (destinationTitle) params.set("destTitle", destinationTitle);
    redirect(`/admin/utilities/move-questions?${params.toString()}`);
  } catch (err) {
    return toFormState(err);
  }
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
