import Link from "next/link";
import { notFound } from "next/navigation";
import { getModule } from "@/features/modules/service";
import { getNextQuestionOrder } from "@/features/questions/service";
import { QuestionForm } from "./question-form";

export const metadata = { title: "New Question · Admin" };

export default async function NewQuestionPage({
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

  const nextOrder = await getNextQuestionOrder(moduleId);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Link href="/admin/courses" className="hover:text-foreground">Courses</Link>
          <span>/</span>
          <Link href={`/admin/courses/${courseId}`} className="hover:text-foreground">
            {mod.courseModules[0]?.course.title ?? "Course"}
          </Link>
          <span>/</span>
          <span>{mod.title}</span>
          <span>/</span>
          <span>New question</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">New question</h1>
      </div>
      <div className="rounded-lg border border-border bg-card p-6">
        <QuestionForm
          mode="create"
          moduleId={moduleId}
          courseId={courseId}
          defaultOrder={nextOrder}
        />
      </div>
    </div>
  );
}
