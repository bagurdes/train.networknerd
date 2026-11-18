import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { requireRole } from "@/lib/authorize";
import {
  buildAnswerKeysBundleFile,
  buildQuestionsBundleFile,
} from "@/features/modules/export";
import { AppError } from "@/lib/errors";

/**
 * GET /api/modules/export?type=questions|answers&ids=id1&ids=id2
 *
 * Admin-only. Streams a single combined plain-text file for the selected
 * modules. Powers the "Download Questions and Answers" utility.
 */
export async function GET(req: NextRequest) {
  try {
    await requireRole([Role.ADMIN]);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const type = req.nextUrl.searchParams.get("type") ?? "questions";
  const ids = req.nextUrl.searchParams.getAll("ids").filter(Boolean);

  if (ids.length === 0) {
    return NextResponse.json(
      { error: "Select at least one module to export" },
      { status: 400 },
    );
  }

  try {
    const file =
      type === "answers"
        ? await buildAnswerKeysBundleFile(ids)
        : await buildQuestionsBundleFile(ids);

    return new NextResponse(file.content, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${file.filename}"`,
      },
    });
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("[export bundle] Unhandled:", err);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
