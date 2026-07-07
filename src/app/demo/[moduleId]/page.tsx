import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DemoQuestionRunner } from "./demo-question-runner";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ moduleId: string }>;
}) {
  const { moduleId } = await params;
  const mod = await prisma.module.findUnique({
    where: { id: moduleId },
    select: { title: true, isPublic: true },
  });
  return { title: mod?.isPublic ? `${mod.title} · Network Nerd` : "Not found" };
}

export default async function DemoModulePage({
  params,
}: {
  params: Promise<{ moduleId: string }>;
}) {
  const { moduleId } = await params;

  const mod = await prisma.module.findUnique({
    where: { id: moduleId },
    select: {
      id: true,
      title: true,
      description: true,
      isPublic: true,
      questions: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          prompt: true,
          hint: true,
          order: true,
        },
      },
    },
  });

  // Only public modules are reachable — everything else 404s.
  if (!mod || !mod.isPublic) notFound();

  return (
    <div className="min-h-screen bg-background">
      {/* Simple public header */}
      <header className="border-b border-border bg-card">
        <div className="container flex h-14 items-center">
          <span className="text-sm font-bold uppercase tracking-widest text-primary">
            Network Nerd
          </span>
          <span className="ml-3 text-xs text-muted-foreground">Live Demo</span>
        </div>
      </header>

      <main className="container max-w-2xl mx-auto py-8 px-4 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{mod.title}</h1>
          <p className="text-muted-foreground mt-1 whitespace-pre-wrap">{mod.description}</p>
          <p className="text-xs text-muted-foreground mt-2">
            Your answers are stored only in your browser — nothing is saved on our servers.
          </p>
        </div>

        {mod.questions.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
            No questions in this module yet.
          </div>
        ) : (
          <DemoQuestionRunner moduleId={mod.id} questions={mod.questions} />
        )}
      </main>
    </div>
  );
}
