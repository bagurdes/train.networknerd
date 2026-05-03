import Link from "next/link";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = { title: "Admin" };

const TILES = [
  { href: "/admin/courses", title: "Courses", description: "Author courses, modules, and questions." },
  { href: "/admin/classes", title: "Classes", description: "Cohorts of students working through a course." },
  { href: "/admin/users", title: "Users", description: "Admins, instructors, and students." },
] as const;

export default function AdminHome() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin</h1>
        <p className="text-muted-foreground">
          Manage curriculum and people. The Classes and Users sections will be
          built out in the next session — Courses is wired up end-to-end as the
          architectural pattern.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {TILES.map((tile) => (
          <Link key={tile.href} href={tile.href}>
            <Card className="h-full transition hover:border-primary">
              <CardHeader>
                <CardTitle>{tile.title}</CardTitle>
                <CardDescription>{tile.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
