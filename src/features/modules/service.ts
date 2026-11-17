import { prisma } from "@/lib/prisma";
import { NotFoundError, ConflictError } from "@/lib/errors";
import type { CreateModuleInput, UpdateModuleInput } from "./schema";

// List modules assigned to a course, in course order.
export async function listModules(courseId: string) {
  const courseModules = await prisma.courseModule.findMany({
    where: { courseId },
    orderBy: { order: "asc" },
    include: {
      module: {
        include: {
          _count: { select: { questions: true } },
        },
      },
    },
  });
  return courseModules.map((cm) => ({
    ...cm.module,
    order: cm.order,
    courseModuleId: cm.id,
  }));
}

export type ModuleListItem = Awaited<ReturnType<typeof listModules>>[number];

// List ALL modules (for assigning to a course). Excludes archived by default.
export async function listAllModules() {
  return prisma.module.findMany({
    where: { archivedAt: null },
    orderBy: { title: "asc" },
    select: {
      id: true,
      title: true,
      description: true,
      _count: { select: { questions: true, courseModules: true } },
    },
  });
}

// Admin modules page: active OR archived (not both), with the extra fields
// that page needs. Business logic stays here, page just renders the result.
export async function listModulesForAdmin({ archived }: { archived: boolean }) {
  return prisma.module.findMany({
    where: archived ? { archivedAt: { not: null } } : { archivedAt: null },
    orderBy: { title: "asc" },
    select: {
      id: true,
      title: true,
      slug: true,
      isPublic: true,
      archivedAt: true,
      _count: { select: { questions: true } },
      courseModules: {
        select: { course: { select: { id: true, title: true } } },
      },
    },
  });
}

// List modules NOT yet in a specific course (for the assign form).
// Archived modules are hidden — they're frozen by design, so you'd Copy first.
export async function listUnassignedModules(courseId: string) {
  const assigned = await prisma.courseModule.findMany({
    where: { courseId },
    select: { moduleId: true },
  });
  const assignedIds = assigned.map((cm) => cm.moduleId);

  return prisma.module.findMany({
    where: {
      id: { notIn: assignedIds.length ? assignedIds : ["__none__"] },
      archivedAt: null,
    },
    orderBy: { title: "asc" },
    select: {
      id: true,
      title: true,
      _count: { select: { questions: true } },
    },
  });
}

export async function getModule(id: string) {
  const mod = await prisma.module.findUnique({
    where: { id },
    include: {
      courseModules: {
        include: { course: { select: { id: true, title: true } } },
        orderBy: { order: "asc" },
      },
      questions: {
        orderBy: { order: "asc" },
        select: { id: true, prompt: true, order: true },
      },
    },
  });
  if (!mod) throw new NotFoundError("Module not found");
  return mod;
}

export async function getNextModuleOrder(courseId: string): Promise<number> {
  const last = await prisma.courseModule.findFirst({
    where: { courseId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  return (last?.order ?? 0) + 1;
}

// Create a new standalone module AND assign it to a course in one step.
export async function createModule(courseId: string, input: CreateModuleInput) {
  const mod = await prisma.module.create({
    data: {
      title: input.title,
      description: input.description,
      isPublic: input.isPublic,
      slug: input.slug || null,
    },
    select: { id: true },
  });

  await prisma.courseModule.create({
    data: { courseId, moduleId: mod.id, order: input.order },
  });

  return mod;
}

// Assign an existing module to a course.
export async function assignModuleToCourse(
  courseId: string,
  moduleId: string,
  order: number,
) {
  const existing = await prisma.courseModule.findFirst({
    where: { courseId, moduleId },
  });
  if (existing) throw new ConflictError("This module is already in this course");

  return prisma.courseModule.create({
    data: { courseId, moduleId, order },
  });
}

// Remove a module from a course (does NOT delete the module itself).
export async function unassignModuleFromCourse(courseId: string, moduleId: string) {
  const result = await prisma.courseModule.deleteMany({
    where: { courseId, moduleId },
  });
  if (result.count === 0) throw new NotFoundError("Module not found in this course");
}

// Update module title and description only (order is per-course, on CourseModule).
export async function updateModule(id: string, input: UpdateModuleInput) {
  const result = await prisma.module.updateMany({
    where: { id },
    data: { title: input.title, description: input.description, isPublic: input.isPublic, slug: input.slug || null, },
  });
  if (result.count === 0) throw new NotFoundError("Module not found");
}

// Delete a module entirely (removes it from ALL courses).
export async function deleteModule(id: string) {
  const result = await prisma.module.deleteMany({ where: { id } });
  if (result.count === 0) throw new NotFoundError("Module not found");
}

// ---------------------------------------------------------------------------
// Copy & archive
// ---------------------------------------------------------------------------

/**
 * Deep-copy a module: duplicates the module itself, every question (with its
 * media), and the module's own media. The copy is standalone — NOT assigned
 * to any course. The admin assigns the copy to a course manually afterward.
 *
 * Why not auto-assign: the usual reason to copy is "same questions, different
 * course." Auto-assigning to the source's course would almost always be wrong.
 *
 * Runs in a transaction — all-or-nothing, no half-copied modules.
 */
export async function copyModule(sourceId: string): Promise<{ id: string }> {
  const source = await prisma.module.findUnique({
    where: { id: sourceId },
    include: {
      media: true,
      questions: {
        include: { media: true },
        orderBy: { order: "asc" },
      },
    },
  });
  if (!source) throw new NotFoundError("Module not found");

  return prisma.$transaction(async (tx) => {
    const copy = await tx.module.create({
      data: {
        title: `${source.title} (copy)`,
        description: source.description,
        // Copies start private; demo-mode is a deliberate flip per module.
        isPublic: false,
        // Slug is globally unique — copies must pick a new one if wanted.
        slug: null,
      },
      select: { id: true },
    });

    if (source.media.length > 0) {
      await tx.media.createMany({
        data: source.media.map((m) => ({
          url: m.url,
          kind: m.kind,
          caption: m.caption,
          moduleId: copy.id,
        })),
      });
    }

    // Questions need per-row inserts because each one owns media rows that
    // reference the new question id. createMany doesn't let us cascade.
    for (const q of source.questions) {
      const newQ = await tx.question.create({
        data: {
          moduleId: copy.id,
          prompt: q.prompt,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          hint: q.hint,
          order: q.order,
        },
        select: { id: true },
      });

      if (q.media.length > 0) {
        await tx.media.createMany({
          data: q.media.map((m) => ({
            url: m.url,
            kind: m.kind,
            caption: m.caption,
            questionId: newQ.id,
          })),
        });
      }
    }

    return copy;
  });
}

/** Soft-delete: existing CourseModule links are preserved. */
export async function archiveModule(id: string): Promise<void> {
  const mod = await prisma.module.findUnique({
    where: { id },
    select: { id: true, archivedAt: true },
  });
  if (!mod) throw new NotFoundError("Module not found");
  if (mod.archivedAt) return; // already archived — no-op
  await prisma.module.update({
    where: { id },
    data: { archivedAt: new Date() },
  });
}

/** Restore an archived module. No-op if it's already active. */
export async function unarchiveModule(id: string): Promise<void> {
  const mod = await prisma.module.findUnique({
    where: { id },
    select: { id: true, archivedAt: true },
  });
  if (!mod) throw new NotFoundError("Module not found");
  if (!mod.archivedAt) return; // already active — no-op
  await prisma.module.update({
    where: { id },
    data: { archivedAt: null },
  });
}
