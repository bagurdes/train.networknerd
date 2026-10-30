"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/authorize";
import { Role } from "@prisma/client";
import { assertStudentCanAccessQuestion, revealAnswer, submitAttempt } from "./service";
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

    await assertStudentCanAccessQuestion(user.id, classId, moduleId, questionId);
    const { attempt, question } = await submitAttempt(user.id, questionId, studentAnswer);

    revalidatePath(`/classes/${classId}/modules/${moduleId}`);

    // Only a correct answer comes back with the answer and explanation.
    // Wrong / unsure answers get them via revealAnswerAction, on request.
    const correct = attempt.verdict === "CORRECT";
    return {
      ok: true,
      verdict: attempt.verdict,
      rationale: attempt.aiRationale ?? undefined,
      correctAnswer: correct ? question.correctAnswer : undefined,
      explanation: correct ? question.explanation : undefined,
      studentAnswer,
    };
  } catch (err) {
    if (err instanceof AppError) return { ok: false, error: err.message };
    console.error("[attempts.actions] Unhandled:", err);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

export interface RevealResult {
  ok: boolean;
  error?: string;
  correctAnswer?: string;
  explanation?: string;
}

/** "Show Correct Answer and Explanation" button after a wrong or unsure answer. */
export async function revealAnswerAction(
  questionId: string,
  classId: string,
  moduleId: string,
): Promise<RevealResult> {
  try {
    const user = await requireRole([Role.STUDENT]);
    await assertStudentCanAccessQuestion(user.id, classId, moduleId, questionId);
    const q = await revealAnswer(user.id, questionId);
    return { ok: true, correctAnswer: q.correctAnswer, explanation: q.explanation };
  } catch (err) {
    if (err instanceof AppError) return { ok: false, error: err.message };
    console.error("[attempts.actions] Unhandled:", err);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
