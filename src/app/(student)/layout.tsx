import { requireUser } from "@/lib/authorize";
import { SiteHeader } from "@/components/site-header";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader user={user} />
      <main className="container py-10">{children}</main>
    </div>
  );
}
