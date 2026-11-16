import Link from "next/link";
import { Logo } from "@/components/logo";

/**
 * Shared shell for auth pages (login, register, reset). Centered card on cream.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <Link
          href="/"
          className="block transition-opacity hover:opacity-90"
          aria-label="Network Nerd home"
        >
          <Logo variant="full" priority className="mx-auto h-28 w-auto" />
        </Link>
        {children}
      </div>
    </main>
  );
}
