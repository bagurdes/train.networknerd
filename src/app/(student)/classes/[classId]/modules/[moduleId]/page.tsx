import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/authorize";
import { prisma } from "@/lib/prisma";
import { getModuleProgress } from "@/features/attempts/service";
import { QuestionRunner } from "./question-runner";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ classId: string; moduleId: string }>;
}) {
  const { moduleId } = await params;
  try {
    const mod = await prisma.module.findUnique({ where: { id: moduleId }, select: { title: true } });
    return { title: mod?.title ?? "Module" };
  } catch {
    return { title: "Module" };
  }
}

export default async function StudentModulePage({
  params,
}: {
  params: Promise<{ classId: string; moduleId: string }>;
}) {
  const { classId, moduleId } = await params;
  const user = await requireUser();

  // Verify enrollment
  const membership = await prisma.classMembership.findUnique({
    where: { classId_userId: { classId, userId: user.id } },
  });
  if (!membership) notFound();

  const mod = await prisma.module.findUnique({
    where: { id: moduleId },
    include: { courseModules: { include: { course: { select: { title: true } } } } },
  });
  if (!mod) notFound();

  const questions = await getModuleProgress(user.id, moduleId);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Link href="/dashboard" className="hover:text-foreground">Dashboard</Link>
          <span>/</span>
          <Link href={`/classes/${classId}`} className="hover:text-foreground">
            {mod.courseModules[0]?.course.title ?? "Course"}
          </Link>
          <span>/</span>
          <span>{mod.title}</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{mod.title}</h1>
        <p className="text-muted-foreground mt-1">{mod.description}</p>
      </div>

      {questions.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
          No questions in this module yet.
        </div>
      ) : (
        <QuestionRunner questions={questions} classId={classId} moduleId={moduleId} />
      )}
    </div>
  );
}
