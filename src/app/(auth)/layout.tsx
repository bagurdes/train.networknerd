import Link from "next/link";

/**
 * Shared shell for auth pages (login, register, reset). Centered card on cream.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <Link
          href="/"
          className="block text-center text-sm font-semibold uppercase tracking-widest text-primary hover:text-accent"
        >
          Network Nerd
        </Link>
        {children}
      </div>
    </main>
  );
}
