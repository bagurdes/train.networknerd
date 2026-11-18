"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { Role } from "@prisma/client";
import { requireRole } from "@/lib/authorize";
import { AppError } from "@/lib/errors";
import { createModuleSchema, updateModuleSchema, assignModuleSchema } from "./schema";
import {
  archiveModule,
  assignModuleToCourse,
  copyModule,
  createModule,
  deleteModule,
  getNextModuleOrder,
  reorderCourseModules,
  unarchiveModule,
  unassignModuleFromCourse,
  updateModule,
} from "./service";

export interface FormState {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

export async function createModuleAction(
  courseId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    await requireRole([Role.ADMIN]);
    const nextOrder = await getNextModuleOrder(courseId);
    const input = createModuleSchema.parse({
      title: formData.get("title"),
      description: formData.get("description"),
      order: formData.get("order") || String(nextOrder),
      isPublic: formData.get("isPublic") === "true",
      slug: formData.get("slug"),
    });
    await createModule(courseId, input);
    revalidatePath(`/admin/courses/${courseId}`);
    redirect(`/admin/courses/${courseId}`);
  } catch (err) {
    return toFormState(err);
  }
}

export async function assignModuleAction(
  courseId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    await requireRole([Role.ADMIN]);
    const nextOrder = await getNextModuleOrder(courseId);
    const input = assignModuleSchema.parse({
      moduleId: formData.get("moduleId"),
      order: formData.get("order") || String(nextOrder),
    });
    await assignModuleToCourse(courseId, input.moduleId, input.order);
    revalidatePath(`/admin/courses/${courseId}`);
    return { ok: true };
  } catch (err) {
    return toFormState(err);
  }
}

export async function unassignModuleAction(courseId: string, moduleId: string): Promise<void> {
  await requireRole([Role.ADMIN]);
  await unassignModuleFromCourse(courseId, moduleId);
  revalidatePath(`/admin/courses/${courseId}`);
}

export async function updateModuleAction(
  id: string,
  courseId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    await requireRole([Role.ADMIN]);
    const input = updateModuleSchema.parse({
      title: formData.get("title"),
      description: formData.get("description"),
      isPublic: formData.get("isPublic") === "true",
      slug: formData.get("slug"),
    });
    await updateModule(id, input);
    revalidatePath(`/admin/courses/${courseId}`);
    redirect(`/admin/courses/${courseId}`);
  } catch (err) {
    return toFormState(err);
  }
}

export async function deleteModuleAction(id: string, courseId: string): Promise<void> {
  await requireRole([Role.ADMIN]);
  await deleteModule(id);
  revalidatePath(`/admin/courses/${courseId}`);
  redirect(`/admin/courses/${courseId}`);
}

function toFormState(err: unknown): FormState {
  if (err instanceof ZodError) return { fieldErrors: err.flatten().fieldErrors };
  if (err instanceof AppError) return { error: err.message };
  if (err && typeof err === "object" && "digest" in err) throw err;
  console.error("[modules.actions] Unhandled:", err);
  return { error: "Something went wrong. Please try again." };
}

export async function updateStandaloneModuleAction(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    await requireRole([Role.ADMIN]);
    const input = updateModuleSchema.parse({
      title: formData.get("title"),
      description: formData.get("description"),
      isPublic: formData.get("isPublic") === "true",
      slug: formData.get("slug"),
    });
    await updateModule(id, input);
    revalidatePath("/admin/modules");
    return { ok: true };
  } catch (err) {
    return toFormState(err);
  }
}

// ---- Copy / archive / unarchive --------------------------------------------
// All three stay on the modules list — they revalidate the admin page so the
// change is visible on the next render.

export async function copyModuleAction(sourceId: string): Promise<void> {
  await requireRole([Role.ADMIN]);
  await copyModule(sourceId);
  revalidatePath("/admin/modules");
}

export async function archiveModuleAction(id: string): Promise<void> {
  await requireRole([Role.ADMIN]);
  await archiveModule(id);
  revalidatePath("/admin/modules");
}

export async function unarchiveModuleAction(id: string): Promise<void> {
  await requireRole([Role.ADMIN]);
  await unarchiveModule(id);
  revalidatePath("/admin/modules");
}

/**
 * Persist a drag-and-drop reorder of the modules inside a course.
 * Returns ok/error (not a redirect) so the client can undo the optimistic UI.
 */
export async function reorderCourseModulesAction(
  courseId: string,
  orderedCourseModuleIds: string[],
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireRole([Role.ADMIN]);
    await reorderCourseModules(courseId, orderedCourseModuleIds);
    revalidatePath(`/admin/courses/${courseId}`);
    return { ok: true };
  } catch (err) {
    if (err instanceof AppError) return { ok: false, error: err.message };
    console.error("[modules.actions] reorder:", err);
    return { ok: false, error: "Could not reorder modules" };
  }
}
