import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/errors";

/**
 * Plain-text exports for a module.
 *
 * - buildQuestionsFile: numbered questions, then hints on a "separate page"
 *   (form-feed + visual divider) listing question number + hint only.
 * - buildAnswerKeyFile: question, answer, explanation per question, clearly
 *   labeled so answers stand out from explanations.
 */

const PAGE_BREAK = "\f\n" + "=".repeat(70) + "\n";

async function getModuleWithQuestions(moduleId: string) {
  const mod = await prisma.module.findUnique({
    where: { id: moduleId },
    select: {
      title: true,
      questions: {
        orderBy: { order: "asc" },
        select: {
          prompt: true,
          correctAnswer: true,
          explanation: true,
          hint: true,
        },
      },
    },
  });
  if (!mod) throw new NotFoundError("Module not found");
  return mod;
}

export async function buildQuestionsFile(moduleId: string): Promise<{ filename: string; content: string }> {
  const mod = await getModuleWithQuestions(moduleId);

  const lines: string[] = [];
  lines.push(mod.title);
  lines.push("=".repeat(mod.title.length));
  lines.push("");

  mod.questions.forEach((q, i) => {
    lines.push(`Question ${i + 1}`);
    lines.push("-".repeat(12));
    lines.push(q.prompt.trim());
    lines.push("");
    lines.push("");
  });

  // Hints section on a "separate page"
  const hintsExist = mod.questions.some((q) => q.hint && q.hint.trim());
  if (hintsExist) {
    lines.push(PAGE_BREAK);
    lines.push("HINTS");
    lines.push("=".repeat(5));
    lines.push("");
    mod.questions.forEach((q, i) => {
      if (q.hint && q.hint.trim()) {
        lines.push(`Question ${i + 1}: ${q.hint.trim()}`);
        lines.push("");
      }
    });
  }

  return {
    filename: `${sanitize(mod.title)}.txt`,
    content: lines.join("\n"),
  };
}

export async function buildAnswerKeyFile(moduleId: string): Promise<{ filename: string; content: string }> {
  const mod = await getModuleWithQuestions(moduleId);

  const lines: string[] = [];
  lines.push(`${mod.title} — ANSWER KEY`);
  lines.push("=".repeat(mod.title.length + 13));
  lines.push("");

  mod.questions.forEach((q, i) => {
    lines.push(`Question ${i + 1}`);
    lines.push("-".repeat(12));
    lines.push(q.prompt.trim());
    lines.push("");
    lines.push(">>> ANSWER:");
    lines.push(q.correctAnswer.trim());
    lines.push("");
    if (q.explanation && q.explanation.trim()) {
      lines.push("EXPLANATION:");
      lines.push(q.explanation.trim());
      lines.push("");
    }
    lines.push("");
  });

  return {
    filename: `${sanitize(mod.title)}-answers.txt`,
    content: lines.join("\n"),
  };
}

function sanitize(name: string): string {
  return name.trim().replace(/[^a-zA-Z0-9 _-]/g, "").replace(/\s+/g, "_");
}
