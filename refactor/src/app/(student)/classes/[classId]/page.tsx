import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/authorize";
import { prisma } from "@/lib/prisma";
import { formatDateShort } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params;
  try {
    const cls = await prisma.class.findUnique({ where: { id: classId }, select: { name: true } });
    return { title: cls?.name ?? "Class" };
  } catch {
    return { title: "Class" };
  }
}

export default async function StudentClassPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  const user = await requireUser();

  // Verify student is enrolled
  const membership = await prisma.classMembership.findUnique({
    where: { classId_userId: { classId, userId: user.id } },
  });
  if (!membership) notFound();

  const cls = await prisma.class.findUnique({
    where: { id: classId },
    include: {
      course: {
        include: {
          courseModules: {
            orderBy: { order: "asc" },
            include: {
              module: {
                include: {
                  _count: { select: { questions: true } },
                },
              },
            },
          },
        },
      },
    },
  });
  if (!cls) notFound();

  const modules = cls.course.courseModules.map((cm) => ({
    ...cm.module,
    order: cm.order,
  }));

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Link href="/dashboard" className="hover:text-foreground">Dashboard</Link>
          <span>/</span>
          <span>{cls.name}</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{cls.course.title}</h1>
        <p className="text-muted-foreground mt-1">{cls.course.description}</p>
        {cls.course.downloadUrl && (
          <a
            href={cls.course.downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline mt-1 inline-block"
          >
            Download course materials ↗
          </a>
        )}
        <p className="text-xs text-muted-foreground mt-2">
          Class: {cls.name} · Started {formatDateShort(cls.startDate)}
        </p>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Modules</h2>
        {modules.length === 0 ? (
          <p className="text-muted-foreground">No modules available yet.</p>
        ) : (
          <div className="space-y-2">
            {modules.map((mod, i) => (
              <Link
                key={mod.id}
                href={`/classes/${classId}/modules/${mod.id}`}
                className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 hover:border-primary transition-colors"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold text-muted-foreground">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{mod.title}</p>
                  <p className="text-sm text-muted-foreground line-clamp-1">{mod.description}</p>
                </div>
                <div className="text-sm text-muted-foreground shrink-0">
                  {mod._count.questions} questions
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
