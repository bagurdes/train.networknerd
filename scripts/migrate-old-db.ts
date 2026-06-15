/**
 * scripts/migrate-old-db.ts
 *
 * Migrates modules and questions from the old database into the new schema.
 * Modules are created as standalone records (not assigned to any course).
 * Assign them to courses via the admin UI afterward.
 *
 * Usage:
 *   OLD_DATABASE_URL="postgresql://..." npm run migrate:old-db
 */

import { PrismaClient } from "@prisma/client";
import { Client } from "pg";

const prisma = new PrismaClient();

async function main() {
  const oldDbUrl = process.env.OLD_DATABASE_URL;
  if (!oldDbUrl) throw new Error("OLD_DATABASE_URL environment variable is required");

  console.log("Connecting to old database…");
  const oldDb = new Client({ connectionString: oldDbUrl });
  await oldDb.connect();

  const { rows: oldModules } = await oldDb.query(
    "SELECT id, title, instructions, position, course_id FROM modules ORDER BY course_id, position"
  );
  const { rows: oldQuestions } = await oldDb.query(
    "SELECT id, text, correct_answer, hint, module_id, position FROM questions ORDER BY module_id, position"
  );
  await oldDb.end();

  console.log(`Found ${oldModules.length} modules and ${oldQuestions.length} questions`);

  const moduleIdMap = new Map();

  for (const mod of oldModules) {
    const description = (mod.instructions ?? "").trim() || mod.title;
    const newMod = await prisma.module.create({
      data: { title: mod.title, description },
      select: { id: true },
    });
    moduleIdMap.set(mod.id, newMod.id);
    console.log(`  ✓ "${mod.title}" → ${newMod.id}`);
  }

  let created = 0;
  let skipped = 0;
  const orderTracker = new Map();

  for (const q of oldQuestions) {
    const newModuleId = moduleIdMap.get(q.module_id);
    if (!newModuleId) { skipped++; continue; }

    const currentOrder = orderTracker.get(q.module_id) ?? 0;
    const order = currentOrder + 1;
    orderTracker.set(q.module_id, order);

    const prompt = (q.text ?? "").trim();
    if (!prompt) { skipped++; continue; }

    await prisma.question.create({
      data: {
        moduleId: newModuleId,
        prompt,
        correctAnswer: (q.correct_answer ?? "").trim() || "See instructor for answer",
        explanation: (q.hint ?? "").trim() || (q.correct_answer ?? "").trim() || "See instructor for explanation",
        order,
      },
    });
    created++;
  }

  console.log(`\n✅ Done: ${moduleIdMap.size} modules, ${created} questions created, ${skipped} skipped`);
  console.log("Assign modules to courses via /admin/courses in the admin UI.");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
