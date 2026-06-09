import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourse } from "@/features/courses/service";
import { listModules } from "@/features/modules/service";
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
import { DeleteModuleButton } from "./delete-module-button";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const course = await getCourse(id);
    return { title: `${course.title} · Admin` };
  } catch {
    return { title: "Course · Admin" };
  }
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let course;
  try {
    course = await getCourse(id);
  } catch {
    notFound();
  }

  const modules = await listModules(id);

  return (
    <div className="space-y-8">
      {/* Course header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/admin/courses" className="hover:text-foreground">
              Courses
            </Link>
            <span>/</span>
            <span>{course.title}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{course.title}</h1>
          <p className="text-muted-foreground mt-1 max-w-prose">{course.description}</p>
          {course.downloadUrl && (
            <a
              href={course.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline mt-1 inline-block"
            >
              Download materials ↗
            </a>
          )}
        </div>
        <Button asChild variant="outline">
          <Link href={`/admin/courses/${id}/edit`}>Edit course</Link>
        </Button>
      </div>

      {/* Modules section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Modules</h2>
            <p className="text-sm text-muted-foreground">
              Modules are presented to students in order.
            </p>
          </div>
          <Button asChild>
            <Link href={`/admin/courses/${id}/modules/new`}>Add module</Link>
          </Button>
        </div>

        {modules.length === 0 ? (
          <TableEmpty>
            <p>No modules yet.</p>
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/courses/${id}/modules/new`}>Add the first module</Link>
            </Button>
          </TableEmpty>
        ) : (
          <div className="rounded-lg border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="hidden md:table-cell">Questions</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {modules.map((mod) => (
                  <TableRow key={mod.id}>
                    <TableCell className="text-muted-foreground font-mono text-sm">
                      {mod.order}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{mod.title}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">
                        {mod.description}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {mod._count.questions}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link
                            href={`/admin/courses/${id}/modules/${mod.id}/questions/new`}
                          >
                            + Question
                          </Link>
                        </Button>
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/admin/courses/${id}/modules/${mod.id}/edit`}>
                            Edit
                          </Link>
                        </Button>
                        <DeleteModuleButton
                          id={mod.id}
                          courseId={id}
                          title={mod.title}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
