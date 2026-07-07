import { z } from "zod";

export const createModuleSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().min(1, "Description is required").max(5000),
  order: z.coerce.number().int().min(1, "Order must be at least 1"),
  isPublic: z.coerce.boolean().default(false),
  slug: z.string().trim().regex(/^[a-zA-Z0-9-]*$/, "Letters, numbers, and dashes only").max(50).optional().default(""),
});
export type CreateModuleInput = z.infer<typeof createModuleSchema>;

export const updateModuleSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().min(1, "Description is required").max(5000),
  isPublic: z.coerce.boolean().default(false),
  slug: z.string().trim().regex(/^[a-zA-Z0-9-]*$/, "Letters, numbers, and dashes only").max(50).optional().default(""),
});
export type UpdateModuleInput = z.infer<typeof updateModuleSchema>;

export const assignModuleSchema = z.object({
  moduleId: z.string().min(1, "Module is required"),
  order: z.coerce.number().int().min(1, "Order must be at least 1"),
});
export type AssignModuleInput = z.infer<typeof assignModuleSchema>;
