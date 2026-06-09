"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { Role } from "@prisma/client";
import { requireRole } from "@/lib/authorize";
import { AppError } from "@/lib/errors";
import { createUserSchema, updateUserSchema } from "./schema";
import { createUser, deleteUser, updateUser } from "./service";

export interface FormState {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

export async function createUserAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    await requireRole([Role.ADMIN]);
    const input = createUserSchema.parse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      role: formData.get("role"),
    });
    await createUser(input);
    revalidatePath("/admin/users");
    redirect("/admin/users");
  } catch (err) {
    return toFormState(err);
  }
}

export async function updateUserAction(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    await requireRole([Role.ADMIN]);
    const input = updateUserSchema.parse({
      name: formData.get("name"),
      role: formData.get("role"),
    });
    await updateUser(id, input);
    revalidatePath("/admin/users");
    redirect("/admin/users");
  } catch (err) {
    return toFormState(err);
  }
}

export async function deleteUserAction(id: string): Promise<void> {
  await requireRole([Role.ADMIN]);
  await deleteUser(id);
  revalidatePath("/admin/users");
  redirect("/admin/users");
}

function toFormState(err: unknown): FormState {
  if (err instanceof ZodError) return { fieldErrors: err.flatten().fieldErrors };
  if (err instanceof AppError) return { error: err.message };
  if (err && typeof err === "object" && "digest" in err) throw err;
  console.error("[users.actions] Unhandled:", err);
  return { error: "Something went wrong. Please try again." };
}
