import { requireUser } from "@/lib/authorize";

export const metadata = { title: "Dashboard" };

export default async function StudentDashboard() {
  const user = await requireUser();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome, {user.name}</h1>
        <p className="text-muted-foreground">
          Your assigned classes will appear here. Student class &amp; module
          views land in the next build session.
        </p>
      </div>
    </div>
  );
}
