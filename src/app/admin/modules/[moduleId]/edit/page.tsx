import Link from "next/link";
import { notFound } from "next/navigation";
import { getModule } from "@/features/modules/service";
import { StandaloneModuleForm } from "./standalone-module-form";

export const metadata = { title: "Edit Module · Admin" };

export default async function StandaloneEditModulePage({
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

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Link href="/admin/modules" className="hover:text-foreground">Modules</Link>
          <span>/</span>
          <span>Edit</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Edit module</h1>
        {mod.courseModules.length > 0 && (
          <p className="text-sm text-muted-foreground mt-1">
            Used in: {mod.courseModules.map((cm) => cm.course.title).join(", ")}. 
            Changes apply everywhere this module is used.
          </p>
        )}
      </div>
      <div className="rounded-lg border border-border bg-card p-6">
        <StandaloneModuleForm
          id={moduleId}
          initialValues={{
            title: mod.title,
            description: mod.description,
            isPublic: mod.isPublic,
            slug: mod.slug ?? "",
          }}
        />
      </div>
    </div>
  );
}
