import Link from "next/link";
import { notFound } from "next/navigation";
import { getModule } from "@/features/modules/service";
import { getNextQuestionOrder } from "@/features/questions/service";
import { QuestionForm } from "@/app/admin/courses/[id]/modules/[moduleId]/questions/new/question-form";

export const metadata = { title: "New Question · Admin" };

/**
 * Module-scoped "new question" page. Works whether or not the module has been
 * assigned to any course. Used for copied modules and standalone modules.
 */
export default async function NewStandaloneQuestionPage({
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

  const nextOrder = await getNextQuestionOrder(moduleId);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Link href="/admin/modules" className="hover:text-foreground">Modules</Link>
          <span>/</span>
          <Link
            href={`/admin/modules/${moduleId}/questions`}
            className="hover:text-foreground"
          >
            {mod.title}
          </Link>
          <span>/</span>
          <span>New question</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">New question</h1>
      </div>
      <div className="rounded-lg border border-border bg-card p-6">
        <QuestionForm
          mode="create"
          moduleId={moduleId}
          courseId={null}
          defaultOrder={nextOrder}
        />
      </div>
    </div>
  );
}
