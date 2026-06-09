import { listCourses } from "@/features/courses/service";
import { ClassForm } from "./class-form";

export const metadata = { title: "New Class · Admin" };

export default async function NewClassPage() {
  const courses = await listCourses();

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New class</h1>
        <p className="text-muted-foreground">
          A class assigns students to a course with a start date.
        </p>
      </div>
      <div className="rounded-lg border border-border bg-card p-6">
        <ClassForm mode="create" courses={courses} />
      </div>
    </div>
  );
}
