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
 * A module is "mutable" for move/copy destination purposes if it's not
 * archived and not assigned to any course. These checks mirror what the UI
 * does, but happen server-side for defense in depth.
 */
async function assertModuleIsMutable(
  moduleId: string,
  role: "source" | "destination",
): Promise<void> {
  const mod = await prisma.module.findUnique({
    where: { id: moduleId },
    select: {
      id: true,
      title: true,
      archivedAt: true,
      courseModules: { select: { course: { select: { title: true } } } },
    },
  });
  if (!mod) throw new NotFoundError(`${role === "source" ? "Source" : "Destination"} module not found`);

  if (mod.archivedAt) {
    throw new ValidationError(
      `"${mod.title}" is archived. Copy from it if you need the questions, but it can't be modified.`,
    );
  }
  if (mod.courseModules.length > 0) {
    const names = mod.courseModules.map((cm) => cm.course.title).join(", ");
    throw new ValidationError(
      `"${mod.title}" is assigned to a course (${names}). Copy the module first, or unassign it from courses, before modifying its questions.`,
    );
  }
}

/**
 * Move selected questions from one module to another. Rules:
 * - questionIds must all belong to sourceModuleId
 * - Source and destination must both be mutable (not archived, not in a course)
 * - Moved questions are appended at the end of the destination (in the order
 *   the admin selected them)
 * - Source's remaining questions are renumbered to close the gaps
 *
 * Question identity is preserved — the same Question rows just change moduleId.
 * This means any prior student attempts stay attached to the same question.
 */
export async function moveQuestions(
  sourceModuleId: string,
  questionIds: string[],
  destinationModuleId: string,
): Promise<void> {
  if (sourceModuleId === destinationModuleId) {
    throw new ValidationError("Source and destination must be different modules");
  }
  if (questionIds.length === 0) throw new ValidationError("No questions selected");

  await assertModuleIsMutable(sourceModuleId, "source");
  await assertModuleIsMutable(destinationModuleId, "destination");

  const sourceQuestions = await prisma.question.findMany({
    where: { moduleId: sourceModuleId },
    orderBy: { order: "asc" },
    select: { id: true },
  });
  const sourceIdSet = new Set(sourceQuestions.map((q) => q.id));
  for (const id of questionIds) {
    if (!sourceIdSet.has(id)) {
      throw new ValidationError("Some selected questions don't belong to the source module");
    }
  }

  const lastDestQ = await prisma.question.findFirst({
    where: { moduleId: destinationModuleId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  const startOrder = (lastDestQ?.order ?? 0) + 1;

  // Remaining source questions in their existing order (for renumbering).
  const movedSet = new Set(questionIds);
  const remainingInOrder = sourceQuestions.filter((q) => !movedSet.has(q.id)).map((q) => q.id);

  // Transaction:
  // 1. Point moved questions at the destination with fresh, non-conflicting orders
  //    (starting past the destination's highest existing order).
  // 2. Renumber remaining source questions with the two-phase trick to avoid
  //    the (moduleId, order) unique index being violated mid-transaction.
  await prisma.$transaction([
    ...questionIds.map((id, i) =>
      prisma.question.update({
        where: { id },
        data: { moduleId: destinationModuleId, order: startOrder + i },
      }),
    ),
    ...remainingInOrder.map((id, i) =>
      prisma.question.update({ where: { id }, data: { order: -(i + 1) } }),
    ),
    ...remainingInOrder.map((id, i) =>
      prisma.question.update({ where: { id }, data: { order: i + 1 } }),
    ),
  ]);
}

/**
 * Deep-copy selected questions into a destination module. Each copied question
 * is a brand-new row (new id), so student attempts on the originals stay with
 * the source. Media attached to each question is duplicated too.
 *
 * Source can be any module (even archived or course-assigned) — copy is
 * read-only on the source. Destination must be mutable.
 */
export async function copyQuestions(
  sourceModuleId: string,
  questionIds: string[],
  destinationModuleId: string,
): Promise<void> {
  if (questionIds.length === 0) throw new ValidationError("No questions selected");
  await assertModuleIsMutable(destinationModuleId, "destination");

  const sourceQuestions = await prisma.question.findMany({
    where: { moduleId: sourceModuleId, id: { in: questionIds } },
    include: { media: true },
  });
  if (sourceQuestions.length !== questionIds.length) {
    throw new ValidationError("Some selected questions don't belong to the source module");
  }

  const lastDestQ = await prisma.question.findFirst({
    where: { moduleId: destinationModuleId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  const startOrder = (lastDestQ?.order ?? 0) + 1;

  // Preserve the admin's intended order: use the order they passed in questionIds.
  const byId = new Map(sourceQuestions.map((q) => [q.id, q]));
  const ordered = questionIds.map((id) => byId.get(id)!);

  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < ordered.length; i++) {
      const src = ordered[i];
      if (!src) continue;
      const newQ = await tx.question.create({
        data: {
          moduleId: destinationModuleId,
          prompt: src.prompt,
          correctAnswer: src.correctAnswer,
          explanation: src.explanation,
          hint: src.hint,
          graderNotes: src.graderNotes,
          order: startOrder + i,
        },
        select: { id: true },
      });
      if (src.media.length > 0) {
        await tx.media.createMany({
          data: src.media.map((m) => ({
            url: m.url,
            kind: m.kind,
            caption: m.caption,
            questionId: newQ.id,
          })),
        });
      }
    }
  });
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
