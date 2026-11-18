import Link from "next/link";
import { notFound } from "next/navigation";
import { getModule } from "@/features/modules/service";
import { listQuestions } from "@/features/questions/service";
import { Button } from "@/components/ui/button";
import { TableEmpty } from "@/components/ui/table";
import { SortableQuestionsTable } from "@/components/sortable-questions-table";

export const metadata = { title: "Module Questions · Admin" };

export default async function StandaloneQuestionsPage({
  params,
}: {
  params: Promise<{ moduleId: string }>;
}) {
  const { moduleId } = await params;

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
            <Link href="/admin/modules" className="hover:text-foreground">Modules</Link>
            <span>/</span>
            <span>{mod.title}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Questions</h1>
        </div>
        {/* Module-scoped route — works whether the module is in a course or not. */}
        <Button asChild>
          <Link href={`/admin/modules/${moduleId}/questions/new`}>
            Add question
          </Link>
        </Button>
      </div>

      {questions.length === 0 ? (
        <TableEmpty>
          <p>No questions yet.</p>
        </TableEmpty>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            Drag a row to reorder. Changes save automatically.
          </p>
          <SortableQuestionsTable
            questions={questions.map((q) => ({ id: q.id, prompt: q.prompt, order: q.order }))}
            moduleId={moduleId}
            courseId={null}
          />
        </>
      )}
    </div>
  );
}
