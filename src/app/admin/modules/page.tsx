import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { listModulesForAdmin } from "@/features/modules/service";
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
import { cn } from "@/lib/utils";
import { ModuleRowActions } from "./module-row-actions";

export const metadata = { title: "Modules · Admin" };

export default async function AdminModulesPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const showArchived = view === "archived";

  // One trip for the data we're showing, one trip for both tab counts.
  const [modules, counts] = await Promise.all([
    listModulesForAdmin({ archived: showArchived }),
    prisma.module.groupBy({
      by: ["archivedAt"],
      _count: { _all: true },
    }),
  ]);

  // groupBy returns up to two rows (archivedAt=null and archivedAt=<date>).
  // Collapse to {active, archived} counts.
  let activeCount = 0;
  let archivedCount = 0;
  for (const row of counts) {
    if (row.archivedAt === null) activeCount += row._count._all;
    else archivedCount += row._count._all;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Modules</h1>
        <p className="text-muted-foreground">
          All modules across every course. A module can be used in multiple courses.
          Copy a module when you want a separate, editable version.
        </p>
      </div>

      {/* Tabs — Active | Archived, driven by ?view= */}
      <div className="flex gap-1 border-b border-border">
        <TabLink href="/admin/modules" active={!showArchived}>
          Active <span className="ml-1 text-xs text-muted-foreground">({activeCount})</span>
        </TabLink>
        <TabLink href="/admin/modules?view=archived" active={showArchived}>
          Archived <span className="ml-1 text-xs text-muted-foreground">({archivedCount})</span>
        </TabLink>
      </div>

      {modules.length === 0 ? (
        <TableEmpty>
          {showArchived ? (
            <p>No archived modules.</p>
          ) : (
            <p>No modules yet. Create one from within a course.</p>
          )}
        </TableEmpty>
      ) : (
        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title &amp; assigned courses</TableHead>
                <TableHead className="hidden md:table-cell">Questions</TableHead>
                <TableHead className="hidden lg:table-cell">Demo</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {modules.map((mod) => (
                <TableRow key={mod.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-wrap items-center gap-2">
                      <span>{mod.title}</span>
                      {mod.archivedAt && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          Archived
                        </span>
                      )}
                    </div>
                    {mod.courseModules.length > 0 ? (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {mod.courseModules.map((cm) => (
                          <Link
                            key={cm.course.id}
                            href={`/admin/courses/${cm.course.id}`}
                            className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary hover:bg-primary/20"
                          >
                            {cm.course.title}
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-1.5 text-xs text-muted-foreground">
                        Not assigned to any course
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {mod._count.questions}
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
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/admin/modules/${mod.id}/questions`}>
                          Edit Questions ({mod._count.questions})
                        </Link>
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/admin/modules/${mod.id}/edit`}>Edit Module</Link>
                      </Button>
                      <ModuleRowActions
                        id={mod.id}
                        title={mod.title}
                        archived={!!mod.archivedAt}
                        usedInCourses={mod.courseModules.length}
                      />
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

function TabLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "-mb-px rounded-t-md border-b-2 px-4 py-2 text-sm font-medium transition-colors",
        active
          ? "border-primary text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}
