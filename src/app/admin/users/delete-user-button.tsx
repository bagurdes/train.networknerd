"use client";

import { Button } from "@/components/ui/button";
import { deleteUserAction } from "@/features/users/actions";

export function DeleteUserButton({ id, name }: { id: string; name: string }) {
  async function handleDelete() {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    await deleteUserAction(id);
  }

  return (
    <Button size="sm" variant="destructive" onClick={handleDelete}>
      Delete
    </Button>
  );
}
