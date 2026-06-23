import { prisma } from "@/lib/prisma";
import { gradeAnswer } from "@/features/grading/service";
import { NotFoundError } from "@/lib/errors";

export async function submitAttempt(
  userId: string,
  questionId: string,
  studentAnswer: string,
) {
  // Fetch question for grading
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    select: { prompt: true, correctAnswer: true, explanation: true },
  });
  if (!question) throw new NotFoundError("Question not found");

  // Grade first (synchronous — keeps the UX simple for Phase 1)
  const result = await gradeAnswer({
    prompt: question.prompt,
    correctAnswer: question.correctAnswer,
    explanation: question.explanation ?? undefined,
    studentAnswer,
  });

  // Upsert: replace any previous attempt on this question by this user
  const attempt = await prisma.attempt.upsert({
    where: {
      // We need a unique constraint — use findFirst then update pattern instead
      // since there's no unique index on (userId, questionId)
      id: (
        await prisma.attempt.findFirst({ where: { userId, questionId }, select: { id: true } })
      )?.id ?? "new",
    },
    update: {
      studentAnswer,
      verdict: result.verdict,
      aiRationale: result.rationale,
      aiModel: result.model,
      gradedAt: new Date(),
    },
    create: {
      userId,
      questionId,
      studentAnswer,
      verdict: result.verdict,
      aiRationale: result.rationale,
      aiModel: result.model,
      gradedAt: new Date(),
    },
  });

  return { attempt, question };
}

export async function getAttempt(userId: string, questionId: string) {
  return prisma.attempt.findFirst({
    where: { userId, questionId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getModuleProgress(userId: string, moduleId: string) {
  const questions = await prisma.question.findMany({
    where: { moduleId },
    orderBy: { order: "asc" },
    select: {
      id: true,
      prompt: true,
      correctAnswer: true,
      explanation: true,
      hint: true,
      order: true,
      attempts: {
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          verdict: true,
          studentAnswer: true,
          aiRationale: true,
        },
      },
    },
  });
  return questions;
}
