import { z } from "zod";

export const createModuleSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().min(1, "Description is required").max(5000),
  order: z.coerce.number().int().min(1, "Order must be at least 1"),
});
export type CreateModuleInput = z.infer<typeof createModuleSchema>;

export const updateModuleSchema = createModuleSchema;
export type UpdateModuleInput = z.infer<typeof updateModuleSchema>;
