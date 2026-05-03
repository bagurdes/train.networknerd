import { z } from "zod";

/**
 * Zod schemas for the Courses feature.
 *
 * These are the single source of truth for what a "valid Course input" looks
 * like — used by server actions, route handlers (if/when added), and any
 * form-side validation.
 */

const optionalUrl = z
  .string()
  .trim()
  .max(2048, "URL too long")
  .refine((s) => s === "" || /^https?:\/\//i.test(s), {
    message: "Must start with http:// or https://",
  })
  .transform((s) => (s === "" ? null : s))
  .nullable()
  .optional();

export const createCourseSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().min(1, "Description is required").max(5000),
  downloadUrl: optionalUrl,
});
export type CreateCourseInput = z.infer<typeof createCourseSchema>;

export const updateCourseSchema = createCourseSchema;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
