import { ResetPasswordButton } from "./reset-password-button";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getClass } from "@/features/classes/service";
import { listUsers } from "@/features/users/service";
import { listCourses } from "@/features/courses/service";
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateShort } from "@/lib/utils";
import { ClassForm } from "../new/class-form";
import { AddMembersForm } from "./add-member-form";
import { RemoveMemberButton } from "./remove-member-button";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const cls = await getClass(id);
    return { title: `${cls.name} · Admin` };
  } catch {
    return { title: "Class · Admin" };
  }
}

const MEMBERSHIP_LABELS: Record<string, string> = {
  INSTRUCTOR: "Instructor",
  STUDENT: "Student",
};

export default async function ClassRosterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let cls;
  try {
    cls = await getClass(id);
  } catch {
    notFound();
  }

  const [allUsers, courses] = await Promise.all([listUsers(), listCourses()]);

  // Build enrolled set
  const enrolledUserIds = new Set(cls.memberships.map((m) => m.userId));

  // All users with enrollment status attached
  const usersWithStatus = allUsers.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    alreadyEnrolled: enrolledUserIds.has(u.id),
  }));

  const studentCount = cls.memberships.filter((m) => m.role === "STUDENT").length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Link href="/admin/classes" className="hover:text-foreground">Classes</Link>
          <span>/</span>
          <span>{cls.name}</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{cls.name}</h1>
        <p className="text-muted-foreground">
          Course: {cls.course.title} &middot; Start: {formatDateShort(cls.startDate)}
          {cls.endDate ? ` · End: ${formatDateShort(cls.endDate)}` : " · No end date"}
          {" "}· Students: {studentCount} / {cls.capacity}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Roster table */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold">Roster</h2>
          {cls.memberships.length === 0 ? (
            <TableEmpty>
              <p>No members yet. Add students using the form.</p>
            </TableEmpty>
          ) : (
            <div className="rounded-lg border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cls.memberships.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.user.name}</TableCell>
                      <TableCell className="text-muted-foreground">{m.user.email}</TableCell>
                      <TableCell>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted">
                          {MEMBERSHIP_LABELS[m.role] ?? m.role}
                        </span>
                      </TableCell>
                       <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                        <ResetPasswordButton userId={m.userId} name={m.user.name} />
                        <RemoveMemberButton classId={id} userId={m.userId} name={m.user.name} />
                        </div>
                       </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Add members */}
          <div className="rounded-lg border border-border bg-card p-4 space-y-3">
            <div>
              <h2 className="font-semibold">Add members</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Already enrolled users are shown but cannot be selected.
              </p>
            </div>
            <AddMembersForm classId={id} users={usersWithStatus} />
          </div>

          {/* Edit class */}
          <div className="rounded-lg border border-border bg-card p-4 space-y-3">
            <h2 className="font-semibold">Edit class</h2>
            <ClassForm
              mode="edit"
              id={id}
              courses={courses}
              initialValues={{
                name: cls.name,
                courseId: cls.courseId,
                startDate: cls.startDate.toISOString(),
                endDate: cls.endDate?.toISOString() ?? "",
                capacity: cls.capacity,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
