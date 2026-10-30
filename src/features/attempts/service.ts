import { prisma } from "@/lib/prisma";
import { gradeAnswer } from "@/features/grading/service";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";

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

/**
 * Make sure a student may work on a question: they're in the class, the
 * class's course includes the module, and the question belongs to the module.
 */
export async function assertStudentCanAccessQuestion(
  userId: string,
  classId: string,
  moduleId: string,
  questionId: string,
) {
  const [membership, cls, question] = await Promise.all([
    prisma.classMembership.findUnique({
      where: { classId_userId: { classId, userId } },
      select: { id: true },
    }),
    prisma.class.findUnique({ where: { id: classId }, select: { courseId: true } }),
    prisma.question.findUnique({ where: { id: questionId }, select: { moduleId: true } }),
  ]);
  if (!question || question.moduleId !== moduleId) throw new NotFoundError("Question not found");
  if (!membership || !cls) throw new ForbiddenError();
  const inCourse = await prisma.courseModule.findFirst({
    where: { courseId: cls.courseId, moduleId },
    select: { id: true },
  });
  if (!inCourse) throw new ForbiddenError();
}

/**
 * The "Show Correct Answer and Explanation" button. Only available after the
 * student has made at least one attempt, so answers can't be pulled up front.
 */
export async function revealAnswer(userId: string, questionId: string) {
  const attempt = await prisma.attempt.findFirst({
    where: { userId, questionId },
    select: { id: true },
  });
  if (!attempt) throw new ValidationError("Submit an answer first.");

  const question = await prisma.question.findUnique({
    where: { id: questionId },
    select: { correctAnswer: true, explanation: true },
  });
  if (!question) throw new NotFoundError("Question not found");
  return question;
}
