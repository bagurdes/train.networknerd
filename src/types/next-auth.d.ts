import type { Role } from "@prisma/client";
import type { DefaultSession, DefaultUser } from "next-auth";

/**
 * Extend Auth.js default types with our `id` and `role` fields.
 * This file is loaded automatically by TypeScript via `tsconfig.json`.
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
  }
}
