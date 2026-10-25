import Link from "next/link";
import { requireUser } from "@/lib/authorize";
import { getStudentClasses } from "@/features/classes/service";
import { formatDateShort } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

export default async function StudentDashboard() {
  const user = await requireUser();
  const memberships = await getStudentClasses(user.id);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome, {user.name}</h1>
        <p className="text-muted-foreground mt-1">Your enrolled classes are below.</p>
      </div>

      {memberships.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-10 text-center text-muted-foreground">
          <p className="text-lg font-medium">No classes yet</p>
          <p className="text-sm mt-1">
            You haven&apos;t been enrolled in any classes. Contact your instructor.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {memberships.map((m) => (
            <Link
              key={m.id}
              href={`/classes/${m.class.id}`}
              className="rounded-lg border border-border bg-card p-5 hover:border-primary transition-colors space-y-2 block"
            >
              <h2 className="font-semibold text-lg leading-tight">{m.class.name}</h2>
              <p className="text-sm text-primary font-medium">{m.class.course.title}</p>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {m.class.course.description}
              </p>
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                <span>{m.class.course._count.courseModules} modules</span>
                <span>Started {formatDateShort(m.class.startDate)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
