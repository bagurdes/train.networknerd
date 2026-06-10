import Link from "next/link";
import { listCourses } from "@/features/courses/service";
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
import { formatDateShort } from "@/lib/utils";
import { DeleteCourseButton } from "./delete-course-button";

export const metadata = { title: "Courses · Admin" };

export default async function AdminCoursesListPage() {
  const courses = await listCourses();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Courses</h1>
          <p className="text-muted-foreground">
            A course is a sequence of modules. Modules and questions are edited
            inside the course.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/courses/new">New course</Link>
        </Button>
      </div>

      {courses.length === 0 ? (
        <TableEmpty>
          <p>No courses yet.</p>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/courses/new">Create your first course</Link>
          </Button>
        </TableEmpty>
      ) : (
        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead className="hidden md:table-cell">Modules</TableHead>
                <TableHead className="hidden md:table-cell">Classes</TableHead>
                <TableHead className="hidden lg:table-cell">Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                    <div>{c.title}</div>
                    <div className="line-clamp-1 text-xs text-muted-foreground">
                      {c.description}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {c._count.modules}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {c._count.classes}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">
                    {formatDateShort(c.updatedAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild size="sm" variant="outline">
  			<Link href={`/admin/courses/${c.id}`}>Modules</Link>
			</Button>
			<Button asChild size="sm" variant="outline">
                        <Link href={`/admin/courses/${c.id}/edit`}>Edit</Link>
                      </Button>
                      <DeleteCourseButton id={c.id} title={c.title} />
                    </div>
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
