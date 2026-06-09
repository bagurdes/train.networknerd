"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { Role } from "@prisma/client";
import { requireRole } from "@/lib/authorize";
import { AppError } from "@/lib/errors";
import { createClassSchema, updateClassSchema, addMemberSchema } from "./schema";
import { addMember, createClass, deleteClass, removeMember, updateClass } from "./service";

export interface FormState {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

export async function createClassAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    await requireRole([Role.ADMIN]);
    const input = createClassSchema.parse({
      name: formData.get("name"),
      courseId: formData.get("courseId"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate") ?? "",
      capacity: formData.get("capacity") ?? "30",
    });
    const cls = await createClass(input);
    revalidatePath("/admin/classes");
    redirect(`/admin/classes/${cls.id}`);
  } catch (err) {
    return toFormState(err);
  }
}

export async function updateClassAction(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    await requireRole([Role.ADMIN]);
    const input = updateClassSchema.parse({
      name: formData.get("name"),
      courseId: formData.get("courseId"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate") ?? "",
      capacity: formData.get("capacity") ?? "30",
    });
    await updateClass(id, input);
    revalidatePath("/admin/classes");
    revalidatePath(`/admin/classes/${id}`);
    redirect(`/admin/classes/${id}`);
  } catch (err) {
    return toFormState(err);
  }
}

export async function deleteClassAction(id: string): Promise<void> {
  await requireRole([Role.ADMIN]);
  await deleteClass(id);
  revalidatePath("/admin/classes");
  redirect("/admin/classes");
}

export async function addMemberAction(
  classId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    await requireRole([Role.ADMIN, Role.INSTRUCTOR]);
    const input = addMemberSchema.parse({
      userId: formData.get("userId"),
      role: formData.get("role"),
    });
    await addMember(classId, input);
    revalidatePath(`/admin/classes/${classId}`);
    return { ok: true };
  } catch (err) {
    return toFormState(err);
  }
}

export async function removeMemberAction(classId: string, userId: string): Promise<void> {
  await requireRole([Role.ADMIN, Role.INSTRUCTOR]);
  await removeMember(classId, userId);
  revalidatePath(`/admin/classes/${classId}`);
}

function toFormState(err: unknown): FormState {
  if (err instanceof ZodError) return { fieldErrors: err.flatten().fieldErrors };
  if (err instanceof AppError) return { error: err.message };
  if (err && typeof err === "object" && "digest" in err) throw err;
  console.error("[classes.actions] Unhandled:", err);
  return { error: "Something went wrong. Please try again." };
}
