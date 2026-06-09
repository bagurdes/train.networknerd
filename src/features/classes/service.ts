import { prisma } from "@/lib/prisma";
import { NotFoundError, ConflictError, ValidationError } from "@/lib/errors";
import type { CreateClassInput, UpdateClassInput, AddMemberInput } from "./schema";

export async function listClasses() {
  return prisma.class.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      startDate: true,
      endDate: true,
      capacity: true,
      course: { select: { title: true } },
      _count: { select: { memberships: true } },
    },
  });
}

export type ClassListItem = Awaited<ReturnType<typeof listClasses>>[number];

export async function getClass(id: string) {
  const cls = await prisma.class.findUnique({
    where: { id },
    include: {
      course: { select: { id: true, title: true } },
      memberships: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { joinedAt: "asc" },
      },
    },
  });
  if (!cls) throw new NotFoundError("Class not found");
  return cls;
}

export async function getStudentClasses(userId: string) {
  return prisma.classMembership.findMany({
    where: { userId, role: "STUDENT" },
    include: {
      class: {
        include: {
          course: {
            select: {
              title: true,
              description: true,
              _count: { select: { modules: true } },
            },
          },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });
}

export async function createClass(input: CreateClassInput) {
  return prisma.class.create({
    data: {
      name: input.name,
      courseId: input.courseId,
      startDate: new Date(input.startDate),
      endDate: input.endDate ? new Date(input.endDate) : null,
      capacity: input.capacity,
    },
    select: { id: true },
  });
}

export async function updateClass(id: string, input: UpdateClassInput) {
  const result = await prisma.class.updateMany({
    where: { id },
    data: {
      name: input.name,
      courseId: input.courseId,
      startDate: new Date(input.startDate),
      endDate: input.endDate ? new Date(input.endDate) : null,
      capacity: input.capacity,
    },
  });
  if (result.count === 0) throw new NotFoundError("Class not found");
}

export async function deleteClass(id: string) {
  const result = await prisma.class.deleteMany({ where: { id } });
  if (result.count === 0) throw new NotFoundError("Class not found");
}

export async function addMember(classId: string, input: AddMemberInput) {
  const cls = await prisma.class.findUnique({
    where: { id: classId },
    include: {
      _count: { select: { memberships: { where: { role: "STUDENT" } } } },
    },
  });
  if (!cls) throw new NotFoundError("Class not found");

  if (input.role === "STUDENT" && cls._count.memberships >= cls.capacity) {
    throw new ValidationError(`Class is at capacity (${cls.capacity} students)`);
  }

  const existing = await prisma.classMembership.findUnique({
    where: { classId_userId: { classId, userId: input.userId } },
  });
  if (existing) throw new ConflictError("User is already a member of this class");

  return prisma.classMembership.create({
    data: { classId, userId: input.userId, role: input.role },
  });
}

export async function removeMember(classId: string, userId: string) {
  const result = await prisma.classMembership.deleteMany({
    where: { classId, userId },
  });
  if (result.count === 0) throw new NotFoundError("Membership not found");
}
