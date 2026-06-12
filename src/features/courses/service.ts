import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/errors";
import type { CreateCourseInput, UpdateCourseInput } from "./schema";

/**
 * Courses service — pure business logic.
 *
 * No HTTP, no UI, no auth checks (those happen in actions / route handlers
 * before calling these). Everything that touches the `Course` table goes
 * through this file.
 */

export async function listCourses() {
  return prisma.course.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      downloadUrl: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { modules: true, classes: true } },
    },
  });
}

export type CourseListItem = Awaited<ReturnType<typeof listCourses>>[number];

export async function getCourse(id: string) {
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      courseModules: {
        orderBy: { order: "asc" },
        select: { id: true, order: true, module: { select: { id: true, title: true } } },
      },
    },
  });
  if (!course) throw new NotFoundError("Course not found");
  return course;
}

export async function createCourse(input: CreateCourseInput) {
  return prisma.course.create({
    data: {
      title: input.title,
      description: input.description,
      downloadUrl: input.downloadUrl ?? null,
    },
    select: { id: true },
  });
}

export async function updateCourse(id: string, input: UpdateCourseInput) {
  // Use updateMany to avoid Prisma throwing P2025 — we want our own NotFound.
  const result = await prisma.course.updateMany({
    where: { id },
    data: {
      title: input.title,
      description: input.description,
      downloadUrl: input.downloadUrl ?? null,
    },
  });
  if (result.count === 0) throw new NotFoundError("Course not found");
}

export async function deleteCourse(id: string) {
  const result = await prisma.course.deleteMany({ where: { id } });
  if (result.count === 0) throw new NotFoundError("Course not found");
}
