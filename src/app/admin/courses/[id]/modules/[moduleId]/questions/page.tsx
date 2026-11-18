import Link from "next/link";
import { notFound } from "next/navigation";
import { getModule } from "@/features/modules/service";
import { listQuestions } from "@/features/questions/service";
import { Button } from "@/components/ui/button";
import { TableEmpty } from "@/components/ui/table";
import { SortableQuestionsTable } from "@/components/sortable-questions-table";

export default async function QuestionsListPage({
  params,
}: {
  params: Promise<{ id: string; moduleId: string }>;
}) {
  const { id: courseId, moduleId } = await params;

  let mod;
  try {
    mod = await getModule(moduleId);
  } catch {
    notFound();
  }

  const questions = await listQuestions(moduleId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/admin/courses" className="hover:text-foreground">Courses</Link>
            <span>/</span>
            <Link href={`/admin/courses/${courseId}`} className="hover:text-foreground">
              {mod.courseModules[0]?.course.title ?? "Course"}
            </Link>
            <span>/</span>
            <span>{mod.title}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Questions</h1>
        </div>
        <Button asChild>
          <Link href={`/admin/courses/${courseId}/modules/${moduleId}/questions/new`}>
            Add question
          </Link>
        </Button>
      </div>

      {questions.length === 0 ? (
        <TableEmpty>
          <p>No questions yet.</p>
          <Button asChild variant="outline" size="sm">
            <Link href={`/admin/courses/${courseId}/modules/${moduleId}/questions/new`}>
              Add the first question
            </Link>
          </Button>
        </TableEmpty>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            Drag a row to reorder. Changes save automatically.
          </p>
          <SortableQuestionsTable
            questions={questions.map((q) => ({ id: q.id, prompt: q.prompt, order: q.order }))}
            moduleId={moduleId}
            courseId={courseId}
          />
        </>
      )}
    </div>
  );
}
