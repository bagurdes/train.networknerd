"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { Role } from "@prisma/client";
import { requireRole } from "@/lib/authorize";
import { AppError } from "@/lib/errors";
import { createCourseSchema, updateCourseSchema } from "./schema";
import {
  createCourse,
  deleteCourse,
  updateCourse,
} from "./service";

/**
 * Server actions for the Courses feature.
 *
 * Pattern:
 *   1. requireRole — auth + role check.
 *   2. parse — Zod-validate the FormData.
 *   3. delegate — call the service.
 *   4. revalidate / redirect — refresh affected routes & navigate.
 *
 * Errors are caught and translated to a `FormState` so client forms can show
 * inline messages. Redirect signals (`NEXT_REDIRECT`) are re-thrown so Next.js
 * handles the navigation.
 */

export interface FormState {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

const initial: FormState = {};

export async function createCourseAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    await requireRole([Role.ADMIN]);
    const input = createCourseSchema.parse({
      title: formData.get("title"),
      description: formData.get("description"),
      downloadUrl: formData.get("downloadUrl") ?? "",
    });
    await createCourse(input);
    revalidatePath("/admin/courses");
    redirect("/admin/courses");
  } catch (err) {
    return toFormState(err);
  }
}

export async function updateCourseAction(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    await requireRole([Role.ADMIN]);
    const input = updateCourseSchema.parse({
      title: formData.get("title"),
      description: formData.get("description"),
      downloadUrl: formData.get("downloadUrl") ?? "",
    });
    await updateCourse(id, input);
    revalidatePath("/admin/courses");
    revalidatePath(`/admin/courses/${id}/edit`);
    redirect("/admin/courses");
  } catch (err) {
    return toFormState(err);
  }
}

export async function deleteCourseAction(id: string): Promise<void> {
  await requireRole([Role.ADMIN]);
  await deleteCourse(id);
  revalidatePath("/admin/courses");
  redirect("/admin/courses");
}

function toFormState(err: unknown): FormState {
  void initial;
  if (err instanceof ZodError) {
    return { fieldErrors: err.flatten().fieldErrors };
  }
  if (err instanceof AppError) {
    return { error: err.message };
  }
  if (err && typeof err === "object" && "digest" in err) throw err; // redirect/notFound
  // eslint-disable-next-line no-console
  console.error("[courses.actions] Unhandled:", err);
  return { error: "Something went wrong. Please try again." };
}
