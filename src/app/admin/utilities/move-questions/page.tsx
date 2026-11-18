import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  listModulesForMoveSourcePicker,
  listMutableModules,
} from "@/features/modules/service";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ManageForm } from "./manage-form";

export const metadata = { title: "Move / Copy Questions · Utilities · Admin" };

/**
 * Two-mode page:
 *   - No ?source — admin picks the module to work on (SOURCE picker)
 *   - ?source=<id> — shows that module's questions + destination + actions
 *
 * Success is communicated via extra query params: ?done=move|copy&dest=&count=
 * which a small banner at the top of the page reads and displays.
 */
export default async function MoveQuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    source?: string;
    done?: string;
    dest?: string;
    destTitle?: string;
    count?: string;
  }>;
}) {
  const { source, done, dest, destTitle, count } = await searchParams;

  const allSourceCandidates = await listModulesForMoveSourcePicker();

  if (!source) {
    return (
      <PickSourceView
        modules={allSourceCandidates}
        successBanner={buildSuccessBanner({ done, dest, destTitle, count })}
      />
    );
  }

  // Source selected — fetch it and the eligible destinations.
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
  // Destination dropdown: exclude the source itself.
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
      <h1 className="text-2xl font-bold tracking-tight">
        Move or Copy Questions
      </h1>

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

// ---- Sub-views -------------------------------------------------------------

function PickSourceView({
  modules,
  successBanner,
}: {
  modules: Awaited<ReturnType<typeof listModulesForMoveSourcePicker>>;
  successBanner: React.ReactNode;
}) {
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
          Pick a module to work on. You&rsquo;ll then choose questions to move
          or copy into another module.
        </p>
      </div>

      {successBanner}

      {modules.length === 0 ? (
        <p className="text-muted-foreground">No modules exist yet.</p>
      ) : (
        <div className="rounded-lg border border-border bg-card divide-y divide-border">
          {modules.map((m) => {
            const inCourses = m.courseModules.map((cm) => cm.course.title);
            const archived = !!m.archivedAt;
            return (
              <div key={m.id} className="flex items-center gap-4 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{m.title}</span>
                    {archived && <Badge tone="muted">Archived</Badge>}
                    {inCourses.length > 0 && (
                      <Badge tone="warning">In: {inCourses.join(", ")}</Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {m._count.questions} question
                    {m._count.questions === 1 ? "" : "s"}
                    {(archived || inCourses.length > 0) && (
                      <> · Copy only — can&rsquo;t move questions out</>
                    )}
                  </div>
                </div>
                <Button asChild size="sm">
                  <Link
                    href={`/admin/utilities/move-questions?source=${m.id}`}
                  >
                    Work on this module
                  </Link>
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Breadcrumbs({ sourceTitle }: { sourceTitle: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Link href="/admin/utilities" className="hover:text-foreground">
        Utilities
      </Link>
      <span>/</span>
      <Link
        href="/admin/utilities/move-questions"
        className="hover:text-foreground"
      >
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
        {archived && <Badge tone="muted">Archived</Badge>}
        {courses.length > 0 && (
          <Badge tone="warning">In: {courses.join(", ")}</Badge>
        )}
      </div>
      <div className="text-xs text-muted-foreground">
        {questionCount} question{questionCount === 1 ? "" : "s"}
      </div>
    </div>
  );
}

function Badge({
  tone,
  children,
}: {
  tone: "muted" | "warning";
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs font-medium",
        tone === "muted" && "bg-muted text-muted-foreground",
        tone === "warning" && "bg-secondary/20 text-secondary-foreground",
      )}
    >
      {children}
    </span>
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
  const nDisplay = Number.isFinite(n) ? `${n} question${n === 1 ? "" : "s"}` : "questions";
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
