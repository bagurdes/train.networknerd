import Link from "next/link";
import { notFound } from "next/navigation";
import { getModule } from "@/features/modules/service";
import { listQuestions } from "@/features/questions/service";
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
              {mod.course.title}
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
        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Question</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions.map((q) => (
                <TableRow key={q.id}>
                  <TableCell className="text-muted-foreground font-mono text-sm">
                    {q.order}
                  </TableCell>
                  <TableCell className="font-medium line-clamp-2">{q.prompt}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link
                        href={`/admin/courses/${courseId}/modules/${moduleId}/questions/${q.id}/edit`}
                      >
                        Edit
                      </Link>
                    </Button>
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
