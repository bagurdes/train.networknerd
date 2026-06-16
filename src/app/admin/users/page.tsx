import { ResetPasswordButton } from "./reset-password-button";
import Link from "next/link";
import { listUsers } from "@/features/users/service";
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
import { DeleteUserButton } from "./delete-user-button";
import { VerifyUserButton } from "./verify-user-button";

export const metadata = { title: "Users · Admin" };

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  INSTRUCTOR: "Instructor",
  STUDENT: "Student",
};

export default async function AdminUsersPage() {
  const users = await listUsers();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">Manage all user accounts and roles.</p>
        </div>
        <Button asChild>
          <Link href="/admin/users/new">New user</Link>
        </Button>
      </div>

      {users.length === 0 ? (
        <TableEmpty>
          <p>No users yet.</p>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/users/new">Create the first user</Link>
          </Button>
        </TableEmpty>
      ) : (
        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Verified</TableHead>
                <TableHead className="hidden md:table-cell">Classes</TableHead>
                <TableHead className="hidden lg:table-cell">Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted">
                      {ROLE_LABELS[u.role] ?? u.role}
                    </span>
                  </TableCell>
                  <TableCell>
                    <VerifyUserButton id={u.id} verified={!!u.emailVerified} />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {u._count.memberships}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">
                    {formatDateShort(u.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <ResetPasswordButton userId={u.id} name={u.name} />
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/admin/users/${u.id}/edit`}>Edit</Link>
                      </Button>
                      <DeleteUserButton id={u.id} name={u.name} />
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
