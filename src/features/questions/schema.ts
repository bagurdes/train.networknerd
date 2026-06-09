import { z } from "zod";

export const createQuestionSchema = z.object({
  prompt: z.string().trim().min(1, "Question text is required").max(5000),
  correctAnswer: z.string().trim().min(1, "Correct answer is required").max(5000),
  explanation: z.string().trim().min(1, "Explanation is required").max(5000),
  order: z.coerce.number().int().min(1, "Order must be at least 1"),
});
export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;

export const updateQuestionSchema = createQuestionSchema;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
