import type { Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import { ForbiddenError, UnauthorizedError } from "@/lib/errors";

/**
 * Server-only authorization helpers.
 *
 * Use these at the top of:
 *   - route handlers (`POST`, `GET`, etc. in `app/api/**`)
 *   - server components that render protected pages
 *   - server actions
 *
 * They throw — the route-handler wrapper (`withApiHandler`) translates the
 * exception into 401/403. Server components let the framework handle it.
 */

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return {
    id: session.user.id,
    email: session.user.email ?? "",
    name: session.user.name ?? "",
    role: session.user.role,
  };
}

/** Require a logged-in user. Throws 401 if anonymous. */
export async function requireUser(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();
  return user;
}

/** Require one of the given roles. Throws 401 if anonymous, 403 if mismatched role. */
export async function requireRole(allowed: Role[]): Promise<AuthenticatedUser> {
  const user = await requireUser();
  if (!allowed.includes(user.role)) throw new ForbiddenError();
  return user;
}
