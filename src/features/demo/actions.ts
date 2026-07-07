"use server";

import { prisma } from "@/lib/prisma";
import { gradeAnswer } from "@/features/grading/service";

export interface DemoAttemptResult {
  ok: boolean;
  error?: string;
  verdict?: string;
  rationale?: string;
  correctAnswer?: string;
  explanation?: string;
  studentAnswer?: string;
}

/**
 * Grade an answer for a PUBLIC demo module.
 *
 * Deliberately writes NOTHING to the database — no Attempt rows, no user
 * records. The client stores results in localStorage. This prevents
 * anonymous demo traffic from filling tables.
 *
 * Only works for modules flagged isPublic = true; everything else is
 * rejected so this endpoint can't be used to grade arbitrary questions.
 */
export async function submitDemoAttemptAction(
  questionId: string,
  _prev: DemoAttemptResult,
  formData: FormData,
): Promise<DemoAttemptResult> {
  try {
    const studentAnswer = (formData.get("studentAnswer") as string | null)?.trim() ?? "";
    if (!studentAnswer) {
      return { ok: false, error: "Please enter an answer before submitting." };
    }
    if (studentAnswer.length > 5000) {
      return { ok: false, error: "Answer is too long." };
    }

    // Fetch the question AND verify its module is public.
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      select: {
        prompt: true,
        correctAnswer: true,
        explanation: true,
        module: { select: { isPublic: true } },
      },
    });

    if (!question || !question.module.isPublic) {
      return { ok: false, error: "This question is not available in demo mode." };
    }

    const result = await gradeAnswer({
      prompt: question.prompt,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation || undefined,
      studentAnswer,
    });

    return {
      ok: true,
      verdict: result.verdict,
      rationale: result.rationale,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation ?? "",
      studentAnswer,
    };
  } catch (err) {
    console.error("[demo.actions] Unhandled:", err);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
