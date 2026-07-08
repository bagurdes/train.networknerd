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

  // Use the first course this module belongs to for the question edit routes,
  // since those routes are nested under /admin/courses/[id]/...
  const firstCourseId = mod.courseModules[0]?.course.id;

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
        {firstCourseId && (
          <Button asChild>
            <Link href={`/admin/courses/${firstCourseId}/modules/${moduleId}/questions/new`}>
              Add question
            </Link>
          </Button>
        )}
      </div>

      {!firstCourseId && (
        <p className="text-sm text-muted-foreground">
          This module isn&apos;t assigned to any course yet. Assign it to a course to add questions.
        </p>
      )}

      {questions.length === 0 ? (
        <TableEmpty>
          <p>No questions yet.</p>
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
                  <TableCell className="font-medium">
                    <span className="line-clamp-2 whitespace-pre-wrap">{q.prompt}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    {firstCourseId && (
                      <Button asChild size="sm" variant="outline">
                        <Link
                          href={`/admin/courses/${firstCourseId}/modules/${moduleId}/questions/${q.id}/edit`}
                        >
                          Edit
                        </Link>
                      </Button>
                    )}
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
