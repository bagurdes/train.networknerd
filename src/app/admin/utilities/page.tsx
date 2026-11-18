import Link from "next/link";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = { title: "Utilities · Admin" };

/**
 * Landing page for admin utilities. Each tile links to a focused tool.
 * The admin layout already enforces requireRole([ADMIN]), so this whole
 * section is admin-only by virtue of its path.
 */
const UTILITIES = [
  {
    href: "/admin/utilities/download-qa",
    title: "Download Questions and Answers",
    description:
      "Pick one or more modules and get a combined questions file and/or answer-key file for printing or handoff.",
  },
] as const;

export default function UtilitiesIndex() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Utilities</h1>
        <p className="text-muted-foreground">
          Admin-only tools for managing courses, modules, and users in bulk.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {UTILITIES.map((u) => (
          <Link key={u.href} href={u.href}>
            <Card className="h-full transition hover:border-primary">
              <CardHeader>
                <CardTitle>{u.title}</CardTitle>
                <CardDescription>{u.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
