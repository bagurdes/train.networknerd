import Link from "next/link";
import { listAllModules } from "@/features/modules/service";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = { title: "Modules · Admin" };

export default async function AdminModulesPage() {
  const modules = await prisma.module.findMany({
    orderBy: { title: "asc" },
    select: {
      id: true,
      title: true,
      slug: true,
      isPublic: true,
      _count: { select: { questions: true } },
      courseModules: {
        select: { course: { select: { id: true, title: true } } },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Modules</h1>
        <p className="text-muted-foreground">
          All modules across every course. A module can be used in multiple courses.
        </p>
      </div>

      {modules.length === 0 ? (
        <TableEmpty>
          <p>No modules yet. Create one from within a course.</p>
        </TableEmpty>
      ) : (
        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead className="hidden md:table-cell">Questions</TableHead>
                <TableHead className="hidden md:table-cell">Used in courses</TableHead>
                <TableHead className="hidden lg:table-cell">Demo</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {modules.map((mod) => (
                <TableRow key={mod.id}>
                  <TableCell className="font-medium">{mod.title}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {mod._count.questions}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                    {mod.courseModules.length === 0
                      ? "—"
                      : mod.courseModules.map((cm) => cm.course.title).join(", ")}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {mod.isPublic ? (
                      <a
                        href={`/demo/${mod.slug || mod.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        /demo/{mod.slug || mod.id.slice(0, 8) + "…"}
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">private</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild size="sm" variant="outline">
                        <a href={`/api/modules/${mod.id}/export?type=questions`}>
                          ⬇ Questions
                        </a>
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <a href={`/api/modules/${mod.id}/export?type=answers`}>
                          ⬇ Answer key
                        </a>
                      </Button>
		      <Button asChild size="sm" variant="outline">
                        <Link href={`/admin/modules/${mod.id}/questions`}>
                          Questions ({mod._count.questions})
                        </Link>
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/admin/modules/${mod.id}/edit`}>Edit</Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
