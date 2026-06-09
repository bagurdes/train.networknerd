import { UserForm } from "./user-form";

export const metadata = { title: "New User · Admin" };

export default function NewUserPage() {
  return (
    <div className="max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New user</h1>
        <p className="text-muted-foreground">Create a student, instructor, or admin account.</p>
      </div>
      <div className="rounded-lg border border-border bg-card p-6">
        <UserForm mode="create" />
      </div>
    </div>
  );
}
