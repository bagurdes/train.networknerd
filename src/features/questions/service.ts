import { prisma } from "@/lib/prisma";
import { NotFoundError, ValidationError } from "@/lib/errors";
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
      hint: input.hint ?? "",
      // Store empty string as null so "no notes" is distinguishable in queries.
      graderNotes: input.graderNotes?.trim() ? input.graderNotes : null,
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
      hint: input.hint ?? "",
      graderNotes: input.graderNotes?.trim() ? input.graderNotes : null,
      order: input.order,
    },
  });
  if (result.count === 0) throw new NotFoundError("Question not found");
}

export async function deleteQuestion(id: string) {
  const result = await prisma.question.deleteMany({ where: { id } });
  if (result.count === 0) throw new NotFoundError("Question not found");
}

/**
 * Renumber questions within a module. `orderedIds` must contain every question
 * currently in the module, exactly once, in the desired new order.
 *
 * Two-phase update: first every order becomes a negative value, then positive
 * values. This avoids the (moduleId, order) unique constraint being violated
 * mid-transaction (Postgres checks it per-statement, not deferred).
 */
export async function reorderQuestions(
  moduleId: string,
  orderedIds: string[],
): Promise<void> {
  const existing = await prisma.question.findMany({
    where: { moduleId },
    select: { id: true },
  });
  const existingSet = new Set(existing.map((q) => q.id));

  if (orderedIds.length !== existing.length) {
    throw new ValidationError("Reorder list length doesn't match question count");
  }
  const seen = new Set<string>();
  for (const id of orderedIds) {
    if (!existingSet.has(id)) throw new ValidationError("Unknown question id in reorder list");
    if (seen.has(id)) throw new ValidationError("Duplicate question id in reorder list");
    seen.add(id);
  }

  await prisma.$transaction([
    ...orderedIds.map((id, i) =>
      prisma.question.update({ where: { id }, data: { order: -(i + 1) } }),
    ),
    ...orderedIds.map((id, i) =>
      prisma.question.update({ where: { id }, data: { order: i + 1 } }),
    ),
  ]);
}
