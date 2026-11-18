import Link from "next/link";
import { notFound } from "next/navigation";
import { getQuestion } from "@/features/questions/service";
import { QuestionForm } from "@/app/admin/courses/[id]/modules/[moduleId]/questions/new/question-form";
import { DeleteQuestionButton } from "@/app/admin/courses/[id]/modules/[moduleId]/questions/[qId]/edit/delete-question-button";

export const metadata = { title: "Edit Question · Admin" };

/**
 * Module-scoped question editor. Works for modules that aren't (yet) in a
 * course — notably the output of the Copy action.
 */
export default async function EditStandaloneQuestionPage({
  params,
}: {
  params: Promise<{ moduleId: string; qId: string }>;
}) {
  const { moduleId, qId } = await params;

  let question;
  try {
    question = await getQuestion(qId);
  } catch {
    notFound();
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/admin/modules" className="hover:text-foreground">Modules</Link>
            <span>/</span>
            <Link
              href={`/admin/modules/${moduleId}/questions`}
              className="hover:text-foreground"
            >
              {question.module.title}
            </Link>
            <span>/</span>
            <span>Edit question</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Edit question</h1>
        </div>
        <DeleteQuestionButton id={qId} moduleId={moduleId} courseId={null} />
      </div>
      <div className="rounded-lg border border-border bg-card p-6">
        <QuestionForm
          mode="edit"
          moduleId={moduleId}
          courseId={null}
          id={qId}
          initialValues={{
            prompt: question.prompt,
            correctAnswer: question.correctAnswer,
            explanation: question.explanation,
            hint: question.hint ?? "",
            graderNotes: question.graderNotes ?? "",
            order: question.order,
          }}
        />
      </div>
    </div>
  );
}
