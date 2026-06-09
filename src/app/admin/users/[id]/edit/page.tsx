import { notFound } from "next/navigation";
import { getUser } from "@/features/users/service";
import { UserForm } from "../../new/user-form";

export const metadata = { title: "Edit User · Admin" };

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let user;
  try {
    user = await getUser(id);
  } catch {
    notFound();
  }

  return (
    <div className="max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit user</h1>
        <p className="text-muted-foreground">{user.email}</p>
      </div>
      <div className="rounded-lg border border-border bg-card p-6">
        <UserForm
          mode="edit"
          id={id}
          initialValues={{ name: user.name, role: user.role }}
        />
      </div>
    </div>
  );
}
