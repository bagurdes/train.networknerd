import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/errors";
import type { CreateModuleInput, UpdateModuleInput } from "./schema";

export async function listModules(courseId: string) {
  return prisma.module.findMany({
    where: { courseId },
    orderBy: { order: "asc" },
    select: {
      id: true,
      title: true,
      description: true,
      order: true,
      updatedAt: true,
      _count: { select: { questions: true } },
    },
  });
}

export type ModuleListItem = Awaited<ReturnType<typeof listModules>>[number];

export async function getModule(id: string) {
  const mod = await prisma.module.findUnique({
    where: { id },
    include: {
      course: { select: { id: true, title: true } },
      questions: { orderBy: { order: "asc" }, select: { id: true, prompt: true, order: true } },
    },
  });
  if (!mod) throw new NotFoundError("Module not found");
  return mod;
}

export async function getNextModuleOrder(courseId: string): Promise<number> {
  const last = await prisma.module.findFirst({
    where: { courseId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  return (last?.order ?? 0) + 1;
}

export async function createModule(courseId: string, input: CreateModuleInput) {
  return prisma.module.create({
    data: {
      courseId,
      title: input.title,
      description: input.description,
      order: input.order,
    },
    select: { id: true },
  });
}

export async function updateModule(id: string, input: UpdateModuleInput) {
  const result = await prisma.module.updateMany({
    where: { id },
    data: {
      title: input.title,
      description: input.description,
      order: input.order,
    },
  });
  if (result.count === 0) throw new NotFoundError("Module not found");
}

export async function deleteModule(id: string) {
  const result = await prisma.module.deleteMany({ where: { id } });
  if (result.count === 0) throw new NotFoundError("Module not found");
}
