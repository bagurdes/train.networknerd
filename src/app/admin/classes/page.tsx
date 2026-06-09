import Link from "next/link";
import { listClasses } from "@/features/classes/service";
import { Button } from "@/components/ui/button";
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
import { DeleteClassButton } from "./delete-class-button";

export const metadata = { title: "Classes · Admin" };

export default async function AdminClassesPage() {
  const classes = await listClasses();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Classes</h1>
          <p className="text-muted-foreground">
            A class assigns a group of students to a course.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/classes/new">New class</Link>
        </Button>
      </div>

      {classes.length === 0 ? (
        <TableEmpty>
          <p>No classes yet.</p>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/classes/new">Create the first class</Link>
          </Button>
        </TableEmpty>
      ) : (
        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Course</TableHead>
                <TableHead className="hidden md:table-cell">Members</TableHead>
                <TableHead className="hidden md:table-cell">Start</TableHead>
                <TableHead className="hidden lg:table-cell">End</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-muted-foreground">{c.course.title}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {c._count.memberships} / {c.capacity}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {formatDateShort(c.startDate)}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">
                    {c.endDate ? formatDateShort(c.endDate) : "No end date"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/admin/classes/${c.id}`}>Roster</Link>
                      </Button>
                      <DeleteClassButton id={c.id} name={c.name} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
