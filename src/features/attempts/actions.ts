"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/authorize";
import { Role } from "@prisma/client";
import { submitAttempt } from "./service";
import { AppError } from "@/lib/errors";

export interface AttemptResult {
  ok: boolean;
  error?: string;
  verdict?: string;
  rationale?: string;
  correctAnswer?: string;
  explanation?: string;
  studentAnswer?: string;
}

export async function submitAttemptAction(
  questionId: string,
  classId: string,
  moduleId: string,
  _prev: AttemptResult,
  formData: FormData,
): Promise<AttemptResult> {
  try {
    const user = await requireRole([Role.STUDENT]);
    const studentAnswer = (formData.get("studentAnswer") as string | null)?.trim() ?? "";

    if (!studentAnswer) {
      return { ok: false, error: "Please enter an answer before submitting." };
    }

    const { attempt, question } = await submitAttempt(user.id, questionId, studentAnswer);

    revalidatePath(`/classes/${classId}/modules/${moduleId}`);

    return {
      ok: true,
      verdict: attempt.verdict,
      rationale: attempt.aiRationale ?? undefined,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      studentAnswer,
    };
  } catch (err) {
    if (err instanceof AppError) return { ok: false, error: err.message };
    console.error("[attempts.actions] Unhandled:", err);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
