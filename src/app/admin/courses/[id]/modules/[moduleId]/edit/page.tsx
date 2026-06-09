import Link from "next/link";
import { notFound } from "next/navigation";
import { getModule } from "@/features/modules/service";
import { ModuleForm } from "../new/module-form";

export const metadata = { title: "Edit Module · Admin" };

export default async function EditModulePage({
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

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Link href="/admin/courses" className="hover:text-foreground">Courses</Link>
          <span>/</span>
          <Link href={`/admin/courses/${courseId}`} className="hover:text-foreground">
            {mod.course.title}
          </Link>
          <span>/</span>
          <span>Edit module</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Edit module</h1>
      </div>
      <div className="rounded-lg border border-border bg-card p-6">
        <ModuleForm
          mode="edit"
          courseId={courseId}
          id={moduleId}
          initialValues={{
            title: mod.title,
            description: mod.description,
            order: mod.order,
          }}
        />
      </div>
    </div>
  );
}
