import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourse } from "@/features/courses/service";
import { getNextModuleOrder } from "@/features/modules/service";
import { ModuleForm } from "./module-form";

export const metadata = { title: "New Module · Admin" };

export default async function NewModulePage({
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

  const nextOrder = await getNextModuleOrder(id);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Link href="/admin/courses" className="hover:text-foreground">Courses</Link>
          <span>/</span>
          <Link href={`/admin/courses/${id}`} className="hover:text-foreground">{course.title}</Link>
          <span>/</span>
          <span>New module</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">New module</h1>
      </div>
      <div className="rounded-lg border border-border bg-card p-6">
        <ModuleForm mode="create" courseId={id} defaultOrder={nextOrder} />
      </div>
    </div>
  );
}
