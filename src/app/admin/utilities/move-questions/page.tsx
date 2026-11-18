import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  listModulesForMoveSourcePickerTabbed,
  listMutableModules,
} from "@/features/modules/service";
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
import { ManageForm } from "./manage-form";

export const metadata = { title: "Move / Copy Questions · Utilities · Admin" };

type TabKey = "unassigned" | "active" | "archive";

function parseTab(view: string | undefined): TabKey {
  if (view === "active" || view === "archive") return view;
  return "unassigned";
}

export default async function MoveQuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    source?: string;
    view?: string;
    done?: string;
    dest?: string;
    destTitle?: string;
    count?: string;
  }>;
}) {
  const { source, view, done, dest, destTitle, count } = await searchParams;

  // --- No source selected: show the tabbed source picker ------------------
  if (!source) {
    const activeTab = parseTab(view);
    const buckets = await listModulesForMoveSourcePickerTabbed();

    return (
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/admin/utilities" className="hover:text-foreground">
              Utilities
            </Link>
            <span>/</span>
            <span>Move / Copy Questions</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Move or Copy Questions
          </h1>
          <p className="text-muted-foreground">
            Unassigned modules are the primary workspace — you can both move and
            copy questions out of them. Active and archived modules are
            copy-only.
          </p>
        </div>

        {buildSuccessBanner({ done, dest, destTitle, count })}

        <div className="flex gap-1 border-b border-border">
          <TabLink href="/admin/utilities/move-questions" active={activeTab === "unassigned"}>
            Unassigned{" "}
            <Count>({buckets.unassigned.length})</Count>
          </TabLink>
          <TabLink
            href="/admin/utilities/move-questions?view=active"
            active={activeTab === "active"}
          >
            Active <Count>({buckets.active.length})</Count>
          </TabLink>
          <TabLink
            href="/admin/utilities/move-questions?view=archive"
            active={activeTab === "archive"}
          >
            Archive <Count>({buckets.archived.length})</Count>
          </TabLink>
        </div>

        <PickerTable
          tab={activeTab}
          modules={
            activeTab === "unassigned"
              ? buckets.unassigned
              : activeTab === "active"
                ? buckets.active
                : buckets.archived
          }
        />
      </div>
    );
  }

  // --- Source selected: show questions + destination + action form --------
  const sourceModule = await prisma.module.findUnique({
    where: { id: source },
    select: {
      id: true,
      title: true,
      archivedAt: true,
      courseModules: {
        select: { course: { select: { id: true, title: true } } },
      },
      questions: {
        orderBy: { order: "asc" },
        select: { id: true, prompt: true, order: true },
      },
    },
  });
  if (!sourceModule) notFound();

  const mutable = await listMutableModules();
  const destinations = mutable.filter((m) => m.id !== sourceModule.id);

  const courseAssignments = sourceModule.courseModules.map((cm) => cm.course.title);
  const sourceIsArchived = !!sourceModule.archivedAt;
  const sourceInCourse = courseAssignments.length > 0;
  const moveDisabled = sourceIsArchived || sourceInCourse;
  const moveDisabledReason = sourceIsArchived
    ? `"${sourceModule.title}" is archived. You can copy questions out of it, but can't move them (archived modules are read-only).`
    : sourceInCourse
      ? `"${sourceModule.title}" is in ${courseAssignments.join(", ")}. Copy the module first — or unassign it from courses — before moving questions out.`
      : null;

  return (
    <div className="space-y-6">
      <Breadcrumbs sourceTitle={sourceModule.title} />
      <h1 className="text-2xl font-bold tracking-tight">Move or Copy Questions</h1>

      {buildSuccessBanner({ done, dest, destTitle, count })}

      <SourceSummary
        title={sourceModule.title}
        archived={sourceIsArchived}
        courses={courseAssignments}
        questionCount={sourceModule.questions.length}
      />

      {sourceModule.questions.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-10 text-center text-muted-foreground">
          <p>This module has no questions to move or copy.</p>
        </div>
      ) : (
        <ManageForm
          sourceModuleId={sourceModule.id}
          sourceTitle={sourceModule.title}
          questions={sourceModule.questions.map((q) => ({
            id: q.id,
            prompt: q.prompt,
            order: q.order,
          }))}
          destinations={destinations.map((d) => ({
            id: d.id,
            title: d.title,
            questionCount: d._count.questions,
          }))}
          moveDisabled={moveDisabled}
          moveDisabledReason={moveDisabledReason}
        />
      )}
    </div>
  );
}

// ---- Picker table (shared for all three tabs) ------------------------------

type PickerRow = {
  id: string;
  title: string;
  archivedAt: Date | null;
  _count: { questions: number };
  courseModules: { course: { id: string; title: string } }[];
};

function PickerTable({
  tab,
  modules,
}: {
  tab: TabKey;
  modules: PickerRow[];
}) {
  if (modules.length === 0) {
    return (
      <TableEmpty>
        {tab === "unassigned" && (
          <p>
            No unassigned modules — every active module is in a course. Copy a
            module from the Modules page to get an editable workspace.
          </p>
        )}
        {tab === "active" && <p>No modules are currently assigned to a course.</p>}
        {tab === "archive" && <p>No archived modules.</p>}
      </TableEmpty>
    );
  }

  const copyOnly = tab !== "unassigned";

  return (
    <div className="rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title &amp; assigned courses</TableHead>
            <TableHead className="hidden md:table-cell">Questions</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {modules.map((m) => (
            <TableRow key={m.id}>
              <TableCell className="font-medium">
                <div className="flex flex-wrap items-center gap-2">
                  <span>{m.title}</span>
                  {m.archivedAt && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      Archived
                    </span>
                  )}
                </div>
                {m.courseModules.length > 0 ? (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {m.courseModules.map((cm) => (
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
                {copyOnly && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    Copy only — can&rsquo;t move questions out
                  </div>
                )}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {m._count.questions}
              </TableCell>
              <TableCell className="text-right">
                <Button asChild size="sm">
                  <Link
                    href={`/admin/utilities/move-questions?source=${m.id}`}
                  >
                    Work on this module
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ---- Small presentational helpers -----------------------------------------

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

function Count({ children }: { children: React.ReactNode }) {
  return <span className="ml-1 text-xs text-muted-foreground">{children}</span>;
}

function Breadcrumbs({ sourceTitle }: { sourceTitle: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Link href="/admin/utilities" className="hover:text-foreground">
        Utilities
      </Link>
      <span>/</span>
      <Link href="/admin/utilities/move-questions" className="hover:text-foreground">
        Move / Copy Questions
      </Link>
      <span>/</span>
      <span>{sourceTitle}</span>
      <Link
        href="/admin/utilities/move-questions"
        className="ml-2 text-xs text-primary hover:underline"
      >
        ← Change module
      </Link>
    </div>
  );
}

function SourceSummary({
  title,
  archived,
  courses,
  questionCount,
}: {
  title: string;
  archived: boolean;
  courses: string[];
  questionCount: number;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          Source module
        </span>
        <span className="font-medium">{title}</span>
        {archived && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            Archived
          </span>
        )}
        {courses.length > 0 && (
          <span className="rounded-full bg-secondary/20 px-2 py-0.5 text-xs font-medium text-secondary-foreground">
            In: {courses.join(", ")}
          </span>
        )}
      </div>
      <div className="text-xs text-muted-foreground">
        {questionCount} question{questionCount === 1 ? "" : "s"}
      </div>
    </div>
  );
}

function buildSuccessBanner({
  done,
  dest,
  destTitle,
  count,
}: {
  done?: string;
  dest?: string;
  destTitle?: string;
  count?: string;
}) {
  if (!done || !dest || !count) return null;
  const verb = done === "move" ? "Moved" : "Copied";
  const n = Number.parseInt(count, 10);
  const nDisplay = Number.isFinite(n)
    ? `${n} question${n === 1 ? "" : "s"}`
    : "questions";
  const destLabel = destTitle ? ` to "${destTitle}"` : "";
  return (
    <div className="rounded-lg border border-accent bg-accent/10 px-4 py-3 text-sm text-accent-foreground">
      <span className="font-medium">
        ✓ {verb} {nDisplay}
        {destLabel}.
      </span>{" "}
      <Link
        href={`/admin/modules/${dest}/questions`}
        className="text-primary hover:underline"
      >
        View destination →
      </Link>
    </div>
  );
}
