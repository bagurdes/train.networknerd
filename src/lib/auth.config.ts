import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe Auth.js config.
 *
 * Used by `middleware.ts` which runs on the Edge runtime where Node-only
 * modules (argon2, PrismaClient) cannot be imported. The full config in
 * `auth.ts` extends this with the Credentials provider.
 *
 * Auth on the Edge does *coarse* gating: is the user logged in at all? Role
 * checks happen in pages and route handlers using `requireRole(...)`.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [
    // Populated in `src/lib/auth.ts` (Node runtime).
  ],
  callbacks: {
    authorized({ auth, request }) {
      const path = request.nextUrl.pathname;
      const isLoggedIn = !!auth?.user;

      // Public routes — accessible without auth.
      const publicPaths = ["/", "/login", "/register", "/reset"];
      const isPublic =
        publicPaths.some((p) => path === p || path.startsWith(`${p}/`)) ||
        path.startsWith("/api/auth") ||
        path.startsWith("/_next") ||
        path === "/favicon.ico";

      if (isPublic) return true;
      return isLoggedIn;
    },
    jwt({ token, user }) {
      // On sign-in, copy id + role from the user record into the token.
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as
          | "ADMIN"
          | "INSTRUCTOR"
          | "STUDENT";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
