import Link from "next/link";
import type { Role } from "@prisma/client";
import { logoutAction } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
/**
 * Top bar for authenticated areas. Shows role-aware navigation.
 * The role-specific links are minimal here — each area's layout adds its own
 * sidebar / sub-nav as needed.
 */
export function SiteHeader({
  user,
}: {
  user: { name: string; email: string; role: Role };
}) {
  const homeHref =
    user.role === "ADMIN"
      ? "/admin"
      : user.role === "INSTRUCTOR"
        ? "/classes"
        : "/dashboard";
  return (
    <header className="border-b border-border bg-card">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link
            href={homeHref}
            className="text-sm font-bold uppercase tracking-widest text-primary"
          >
            Network Nerd
          </Link>
          <RoleNav role={user.role} />
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {user.name}
          </span>
          <form action={logoutAction}>
            <Button type="submit" variant="ghost" size="sm">
              Log out
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
function RoleNav({ role }: { role: Role }) {
  const it
