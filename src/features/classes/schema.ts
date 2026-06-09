import { z } from "zod";
import { MembershipRole } from "@prisma/client";

export const createClassSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  courseId: z.string().min(1, "Course is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z
    .string()
    .optional()
    .transform((s) => (s === "" || s === undefined ? null : s)),
  capacity: z.coerce.number().int().min(1).max(100).default(30),
});
export type CreateClassInput = z.infer<typeof createClassSchema>;

export const updateClassSchema = createClassSchema;
export type UpdateClassInput = z.infer<typeof updateClassSchema>;

export const addMemberSchema = z.object({
  userId: z.string().min(1, "User is required"),
  role: z.nativeEnum(MembershipRole),
});
export type AddMemberInput = z.infer<typeof addMemberSchema>;
