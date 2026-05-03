import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "@/lib/errors";

/**
 * Wrap a route handler so thrown AppErrors / ZodErrors become clean HTTP
 * responses. Keeps every API route exactly:
 *
 *   export const POST = withApiHandler(async (req) => {
 *     const body = await req.json();
 *     const dto = createCourseSchema.parse(body);
 *     const course = await coursesService.create(dto);
 *     return NextResponse.json(course, { status: 201 });
 *   });
 */
export function withApiHandler<T extends (...args: never[]) => Promise<Response>>(
  handler: T,
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (err) {
      if (err instanceof ZodError) {
        return NextResponse.json(
          {
            error: "ValidationError",
            message: "Invalid input",
            issues: err.flatten().fieldErrors,
          },
          { status: 400 },
        );
      }
      if (err instanceof AppError) {
        return NextResponse.json(
          { error: err.name, message: err.message },
          { status: err.statusCode },
        );
      }
      // Unknown errors: log on the server, return 500 with a generic message.
      // eslint-disable-next-line no-console
      console.error("[api] Unhandled error:", err);
      return NextResponse.json(
        { error: "InternalServerError", message: "Something went wrong" },
        { status: 500 },
      );
    }
  }) as T;
}
