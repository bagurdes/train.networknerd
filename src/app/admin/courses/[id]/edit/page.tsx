import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCourse } from "@/features/courses/service";
import { CourseForm } from "../../course-form";

export const metadata = { title: "Edit course · Admin" };

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const course = await getCourse(id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Edit course</h1>
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/courses">Cancel</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{course.title}</CardTitle>
          <CardDescription>
            {course.courseModules.length} module{course.courseModules.length === 1 ? "" : "s"}
	    {" · "}
            edit details below. Module &amp; question editing comes next session.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CourseForm
            mode="edit"
            id={course.id}
            initialValues={{
              title: course.title,
              description: course.description,
              downloadUrl: course.downloadUrl ?? "",
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
