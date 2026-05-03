/**
 * Demo seed — one tiny course so the app isn't empty after first install.
 *
 * Run: `npm run db:seed`
 *
 * Idempotent: skips entirely if the demo course already exists. Safe to
 * remove this script once real curriculum is in the DB.
 */

import { prisma } from "../src/lib/prisma";

const DEMO_COURSE_ID = "demo-course";

async function main() {
  const existing = await prisma.course.findUnique({
    where: { id: DEMO_COURSE_ID },
    select: { id: true },
  });

  if (existing) {
    console.log("ℹ️  Demo course already seeded, skipping.");
    return;
  }

  console.log("Seeding demo curriculum…");

  await prisma.course.create({
    data: {
      id: DEMO_COURSE_ID,
      title: "Wireshark 101 — Demo Course",
      description:
        "A short tour of the Network Nerd platform. Replace or delete this when you start authoring real content.",
      modules: {
        create: [
          {
            id: "demo-module-1",
            order: 1,
            title: "Capture basics",
            description:
              "Confirm you can identify a capture interface and start a capture. " +
              "These questions are intentionally simple — they're here to demonstrate " +
              "the answer-and-grade flow end to end.",
            questions: {
              create: [
                {
                  id: "demo-question-1",
                  order: 1,
                  prompt:
                    "Which menu in Wireshark do you use to start a packet capture on a specific interface?",
                  correctAnswer:
                    "The Capture menu (or the Capture toolbar) lets you choose an interface and start a live capture.",
                  explanation:
                    "Wireshark's Capture menu lists all available interfaces. You pick one (e.g., en0 on macOS) and click Start.",
                },
                {
                  id: "demo-question-2",
                  order: 2,
                  prompt:
                    "What display filter shows only HTTP traffic in a capture?",
                  correctAnswer: "http",
                  explanation:
                    "Type `http` into the display filter bar. Wireshark also accepts `tcp.port == 80` for unencrypted HTTP.",
                },
              ],
            },
          },
        ],
      },
    },
  });

  console.log('✅ Seeded "Wireshark 101 — Demo Course" with 1 module and 2 questions.');
}

main()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
