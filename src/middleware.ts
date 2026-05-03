import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

/**
 * Route protection middleware.
 *
 * Runs on the Edge. Uses only the Edge-safe `authConfig`. Coarse logic: if a
 * route isn't public and the user isn't logged in, redirect to /login.
 *
 * Fine-grained role checks happen in pages / route handlers via
 * `requireRole([...])`.
 */
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     *   - /api/auth/* (Auth.js own endpoints)
     *   - /_next/static, /_next/image (Next.js assets)
     *   - /favicon.ico
     *   - /public/*
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
