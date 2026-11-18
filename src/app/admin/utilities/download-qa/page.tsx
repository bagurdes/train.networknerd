import Link from "next/link";
import { listModulesForAdmin } from "@/features/modules/service";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { DownloadQAForm } from "./download-form";

export const metadata = { title: "Download Q&A · Utilities · Admin" };

export default async function DownloadQAPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const showArchived = view === "archived";

  const [modules, counts] = await Promise.all([
    listModulesForAdmin({ archived: showArchived }),
    prisma.module.groupBy({
      by: ["archivedAt"],
      _count: { _all: true },
    }),
  ]);

  let activeCount = 0;
  let archivedCount = 0;
  for (const row of counts) {
    if (row.archivedAt === null) activeCount += row._count._all;
    else archivedCount += row._count._all;
  }

  // Trim the data we pass to the client to just what the form needs.
  const items = modules.map((m) => ({
    id: m.id,
    title: m.title,
    questions: m._count.questions,
    courses: m.courseModules.map((cm) => cm.course.title),
  }));

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Link href="/admin/utilities" className="hover:text-foreground">
            Utilities
          </Link>
          <span>/</span>
          <span>Download Q&amp;A</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">
          Download Questions and Answers
        </h1>
        <p className="text-muted-foreground">
          Pick one or more modules, then choose whether to download the
          questions file (for students to work from) or the answer key (for
          grading and handoff).
        </p>
      </div>

      <div className="flex gap-1 border-b border-border">
        <TabLink href="/admin/utilities/download-qa" active={!showArchived}>
          Active <span className="ml-1 text-xs text-muted-foreground">({activeCount})</span>
        </TabLink>
        <TabLink
          href="/admin/utilities/download-qa?view=archived"
          active={showArchived}
        >
          Archived <span className="ml-1 text-xs text-muted-foreground">({archivedCount})</span>
        </TabLink>
      </div>

      <DownloadQAForm modules={items} archivedTab={showArchived} />
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
