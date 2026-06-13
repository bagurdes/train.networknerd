import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding demo curriculum…");

  // Create a demo course
  const course = await prisma.course.upsert({
    where: { id: "demo-course-001" },
    update: {},
    create: {
      id: "demo-course-001",
      title: "Wireshark 101 — Demo Course",
      description: "A demo course to verify the full stack works end-to-end.",
    },
  });

  // Create a standalone module
  const module = await prisma.module.upsert({
    where: { id: "demo-module-001" },
    update: {},
    create: {
      id: "demo-module-001",
      title: "Introduction to Packet Capture",
      description: "Learn the basics of capturing and reading network packets.",
    },
  });

  // Assign module to course
await prisma.courseModule.createMany({
    data: [{ courseId: course.id, moduleId: module.id, order: 1 }],
    skipDuplicates: true,
  });

  // Create demo questions
  await prisma.question.upsert({
    where: { id: "demo-q-001" },
    update: {},
    create: {
      id: "demo-q-001",
      moduleId: module.id,
      prompt: "What does the TCP SYN flag indicate?",
      correctAnswer:
        "The SYN flag is used to initiate a TCP connection (synchronize sequence numbers).",
      explanation:
        "SYN stands for synchronize. When a client wants to connect to a server, it sends a packet with the SYN flag set. The server responds with SYN-ACK, and the client completes the handshake with ACK.",
      order: 1,
    },
  });

  await prisma.question.upsert({
    where: { id: "demo-q-002" },
    update: {},
    create: {
      id: "demo-q-002",
      moduleId: module.id,
      prompt: "What is the purpose of the Wireshark display filter bar?",
      correctAnswer:
        "The display filter bar lets you filter which packets are shown without modifying the capture.",
      explanation:
        "Display filters narrow down what you see in the packet list without discarding any captured data. They use a syntax like 'tcp.port == 80' or 'ip.addr == 192.168.1.1'. This is different from capture filters, which filter packets before they are recorded.",
      order: 2,
    },
  });

  console.log(
    `✅ Seeded "${course.title}" with 1 module and 2 questions.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
