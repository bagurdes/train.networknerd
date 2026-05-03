import { Role } from "@prisma/client";
import { requireRole } from "@/lib/authorize";
import { SiteHeader } from "@/components/site-header";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Hard role gate: throws ForbiddenError → Next.js renders the not-found page
  // for non-admins. We can swap to a custom 403 page later if desired.
  const user = await requireRole([Role.ADMIN]);
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader user={user} />
      <main className="container py-10">{children}</main>
    </div>
  );
}
