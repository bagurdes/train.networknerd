import { PrismaClient } from "@prisma/client";

/**
 * Singleton Prisma client.
 *
 * Next.js dev hot-reloads modules, which would otherwise spawn a new
 * PrismaClient (and a fresh Postgres connection pool) on every change. Stash
 * the instance on `globalThis` to survive reloads.
 *
 * In production each server instance has exactly one client.
 */
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
