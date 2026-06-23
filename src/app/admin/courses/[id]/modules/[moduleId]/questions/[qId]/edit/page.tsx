import Link from "next/link";
import { notFound } from "next/navigation";
import { getQuestion } from "@/features/questions/service";
import { QuestionForm } from "../../new/question-form";
import { DeleteQuestionButton } from "./delete-question-button";

export const metadata = { title: "Edit Question · Admin" };

export default async function EditQuestionPage({
  params,
}: {
  params: Promise<{ id: string; moduleId: string; qId: string }>;
}) {
  const { id: courseId, moduleId, qId } = await params;

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
            <Link href="/admin/courses" className="hover:text-foreground">Courses</Link>
            <span>/</span>
            <Link href={`/admin/courses/${courseId}`} className="hover:text-foreground">
              {question.module.title}
            </Link>
            <span>/</span>
            <span>Edit question</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Edit question</h1>
        </div>
        <DeleteQuestionButton id={qId} moduleId={moduleId} courseId={courseId} />
      </div>
      <div className="rounded-lg border border-border bg-card p-6">
        <QuestionForm
          mode="edit"
          moduleId={moduleId}
          courseId={courseId}
          id={qId}
          initialValues={{
            prompt: question.prompt,
            correctAnswer: question.correctAnswer,
            explanation: question.explanation,
            hint: question.hint ?? "",
            order: question.order,
          }}
        />
      </div>
    </div>
  );
}
