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

// List ALL modules (for assigning to a course).
export async function listAllModules() {
  return prisma.module.findMany({
    orderBy: { title: "asc" },
    select: {
      id: true,
      title: true,
      description: true,
      _count: { select: { questions: true, courseModules: true } },
    },
  });
}

// List modules NOT yet in a specific course (for the assign form).
export async function listUnassignedModules(courseId: string) {
  const assigned = await prisma.courseModule.findMany({
    where: { courseId },
    select: { moduleId: true },
  });
  const assignedIds = assigned.map((cm) => cm.moduleId);

  return prisma.module.findMany({
    where: { id: { notIn: assignedIds.length ? assignedIds : ["__none__"] } },
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
    data: { title: input.title, description: input.description },
  });
  if (result.count === 0) throw new NotFoundError("Module not found");
}

// Delete a module entirely (removes it from ALL courses).
export async function deleteModule(id: string) {
  const result = await prisma.module.deleteMany({ where: { id } });
  if (result.count === 0) throw new NotFoundError("Module not found");
}
