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
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/modules/${moduleId}/questions/${q.id}/edit`}>
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
