import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { requireRole } from "@/lib/authorize";
import { buildQuestionsFile, buildAnswerKeyFile } from "@/features/modules/export";
import { NotFoundError } from "@/lib/errors";

/**
 * GET /api/modules/[moduleId]/export?type=questions|answers
 *
 * Admin-only. Streams a plain-text file download.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> },
) {
  try {
    await requireRole([Role.ADMIN]);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { moduleId } = await params;
  const type = req.nextUrl.searchParams.get("type") ?? "questions";

  try {
    const file =
      type === "answers"
        ? await buildAnswerKeyFile(moduleId)
        : await buildQuestionsFile(moduleId);

    return new NextResponse(file.content, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${file.filename}"`,
      },
    });
  } catch (err) {
    if (err instanceof NotFoundError) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }
    console.error("[export] Unhandled:", err);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
