import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/errors";
import type { CreateQuestionInput, UpdateQuestionInput } from "./schema";

export async function listQuestions(moduleId: string) {
  return prisma.question.findMany({
    where: { moduleId },
    orderBy: { order: "asc" },
    select: {
      id: true,
      prompt: true,
      order: true,
      updatedAt: true,
    },
  });
}

export type QuestionListItem = Awaited<ReturnType<typeof listQuestions>>[number];

export async function getQuestion(id: string) {
  const question = await prisma.question.findUnique({
    where: { id },
    include: { module: { select: { id: true, title: true } } },
  });
  if (!question) throw new NotFoundError("Question not found");
  return question;
}

export async function getQuestionForStudent(id: string) {
  const question = await prisma.question.findUnique({
    where: { id },
    select: { id: true, prompt: true, moduleId: true },
  });
  if (!question) throw new NotFoundError("Question not found");
  return question;
}

export async function getNextQuestionOrder(moduleId: string): Promise<number> {
  const last = await prisma.question.findFirst({
    where: { moduleId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  return (last?.order ?? 0) + 1;
}

export async function createQuestion(moduleId: string, input: CreateQuestionInput) {
  return prisma.question.create({
    data: {
      moduleId,
      prompt: input.prompt,
      correctAnswer: input.correctAnswer,
      explanation: input.explanation,
      order: input.order,
    },
    select: { id: true },
  });
}

export async function updateQuestion(id: string, input: UpdateQuestionInput) {
  const result = await prisma.question.updateMany({
    where: { id },
    data: {
      prompt: input.prompt,
      correctAnswer: input.correctAnswer,
      explanation: input.explanation,
      order: input.order,
    },
  });
  if (result.count === 0) throw new NotFoundError("Question not found");
}

export async function deleteQuestion(id: string) {
  const result = await prisma.question.deleteMany({ where: { id } });
  if (result.count === 0) throw new NotFoundError("Question not found");
}
