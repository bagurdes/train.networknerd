"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { Role, MembershipRole } from "@prisma/client";
import { requireRole } from "@/lib/authorize";
import { AppError } from "@/lib/errors";
import { createClassSchema, updateClassSchema, addMemberSchema } from "./schema";
import { addMember, createClass, deleteClass, removeMember, updateClass } from "./service";
import { prisma } from "@/lib/prisma";

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

// Bulk add multiple users to a class as students
export async function addMembersAction(
  classId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    await requireRole([Role.ADMIN, Role.INSTRUCTOR]);
    const userIds = formData.getAll("userIds") as string[];

    if (userIds.length === 0) {
      return { error: "Please select at least one user." };
    }

    // Check capacity
    const cls = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        _count: { select: { memberships: { where: { role: "STUDENT" } } } },
      },
    });
    if (!cls) return { error: "Class not found." };

    const currentStudents = cls._count.memberships;
    if (currentStudents + userIds.length > cls.capacity) {
      return {
        error: `Adding ${userIds.length} student(s) would exceed the class capacity of ${cls.capacity}. Currently ${currentStudents} enrolled.`,
      };
    }

    // Add each user, skipping any already enrolled
    let added = 0;
    for (const userId of userIds) {
      const existing = await prisma.classMembership.findUnique({
        where: { classId_userId: { classId, userId } },
      });
      if (!existing) {
        await prisma.classMembership.create({
          data: { classId, userId, role: MembershipRole.STUDENT },
        });
        added++;
      }
    }

    revalidatePath(`/admin/classes/${classId}`);
    return { ok: true, error: added < userIds.length ? `${added} added (some were already enrolled).` : undefined };
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
