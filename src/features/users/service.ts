import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/features/auth/hash";
import { NotFoundError, ConflictError } from "@/lib/errors";
import type { CreateUserInput, UpdateUserInput } from "./schema";

export async function listUsers() {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: { select: { memberships: true } },
    },
  });
}

export type UserListItem = Awaited<ReturnType<typeof listUsers>>[number];

export async function getUser(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true },
  });
  if (!user) throw new NotFoundError("User not found");
  return user;
}

export async function createUser(input: CreateUserInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new ConflictError("A user with that email already exists");
  const passwordHash = await hashPassword(input.password);
  return prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role,
    },
    select: { id: true },
  });
}

export async function updateUser(id: string, input: UpdateUserInput) {
  const result = await prisma.user.updateMany({
    where: { id },
    data: { name: input.name, role: input.role },
  });
  if (result.count === 0) throw new NotFoundError("User not found");
}

export async function deleteUser(id: string) {
  const result = await prisma.user.deleteMany({ where: { id } });
  if (result.count === 0) throw new NotFoundError("User not found");
}
