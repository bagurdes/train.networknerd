import { Prisma, EnrollmentSource, MembershipRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { NotFoundError, ConflictError, ValidationError } from "@/lib/errors";
import { generateJoinCode, normalizeJoinCode } from "./join-code";
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
              _count: { select: { courseModules: true } },
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
      joinCode: generateJoinCode(),
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

// ---------------------------------------------------------------------------
// Join codes
// ---------------------------------------------------------------------------

/** Give a class a new join code. The old code stops working immediately. */
export async function regenerateJoinCode(classId: string): Promise<string> {
  // A collision is astronomically unlikely, but retry on the unique index anyway.
  for (let attempt = 0; attempt < 5; attempt++) {
    const joinCode = generateJoinCode();
    try {
      const result = await prisma.class.updateMany({
        where: { id: classId },
        data: { joinCode },
      });
      if (result.count === 0) throw new NotFoundError("Class not found");
      return joinCode;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") continue;
      throw err;
    }
  }
  throw new Error("Could not generate a unique join code");
}

export async function setJoinEnabled(classId: string, enabled: boolean): Promise<void> {
  const result = await prisma.class.updateMany({
    where: { id: classId },
    data: { joinEnabled: enabled },
  });
  if (result.count === 0) throw new NotFoundError("Class not found");
}

const INVALID_CODE = "That join code isn't valid or is no longer active.";

/**
 * Look up the class a join code belongs to and check it can be joined.
 * Throws a ValidationError with a student-friendly message otherwise.
 */
export async function findJoinableClass(rawCode: string) {
  const joinCode = normalizeJoinCode(rawCode);
  if (!joinCode) throw new ValidationError(INVALID_CODE);

  const cls = await prisma.class.findUnique({
    where: { joinCode },
    select: {
      id: true,
      name: true,
      startDate: true,
      endDate: true,
      capacity: true,
      joinEnabled: true,
      course: { select: { title: true } },
      _count: { select: { memberships: { where: { role: MembershipRole.STUDENT } } } },
    },
  });
  if (!cls || !cls.joinEnabled) throw new ValidationError(INVALID_CODE);
  if (cls.endDate && cls.endDate.getTime() < Date.now()) {
    throw new ValidationError("This class has already ended.");
  }
  return cls;
}

export type JoinableClass = Awaited<ReturnType<typeof findJoinableClass>>;

/**
 * Enroll a student in a class, enforcing capacity. Returns false if they were
 * already a member (not an error — joining twice just takes them to the class).
 */
export async function enrollStudent(
  classId: string,
  userId: string,
  source: EnrollmentSource,
): Promise<boolean> {
  const existing = await prisma.classMembership.findUnique({
    where: { classId_userId: { classId, userId } },
  });
  if (existing) return false;

  const cls = await prisma.class.findUnique({
    where: { id: classId },
    select: {
      capacity: true,
      _count: { select: { memberships: { where: { role: MembershipRole.STUDENT } } } },
    },
  });
  if (!cls) throw new NotFoundError("Class not found");
  if (cls._count.memberships >= cls.capacity) {
    throw new ValidationError("This class is full. Contact your instructor.");
  }

  try {
    await prisma.classMembership.create({
      data: { classId, userId, role: MembershipRole.STUDENT, source },
    });
  } catch (err) {
    // Double-submit race: the membership was created by a parallel request.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") return false;
    throw err;
  }
  return true;
}

/** A logged-in student joins a class with a code. Returns the class id. */
export async function joinClassByCode(userId: string, rawCode: string): Promise<string> {
  const cls = await findJoinableClass(rawCode);
  await enrollStudent(cls.id, userId, EnrollmentSource.JOIN_CODE);
  return cls.id;
}
