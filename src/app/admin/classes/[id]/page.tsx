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
import { AddMemberForm } from "./add-member-form";
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

  // Users not already in the class
  const memberIds = new Set(cls.memberships.map((m) => m.userId));
  const availableUsers = allUsers.filter((u) => !memberIds.has(u.id));

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
          {" "}· Capacity: {cls.memberships.filter((m) => m.role === "STUDENT").length} / {cls.capacity} students
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Roster table */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold">Roster</h2>
          {cls.memberships.length === 0 ? (
            <TableEmpty>
              <p>No members yet. Add students and instructors using the form.</p>
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
                        <RemoveMemberButton classId={id} userId={m.userId} name={m.user.name} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Add member + edit class */}
        <div className="space-y-6">
          <div className="rounded-lg border border-border bg-card p-4 space-y-3">
            <h2 className="font-semibold">Add member</h2>
            <AddMemberForm classId={id} users={availableUsers} />
          </div>

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
