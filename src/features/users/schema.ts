import { z } from "zod";
import { Role } from "@prisma/client";

export const createUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.nativeEnum(Role),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  role: z.nativeEnum(Role),
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
