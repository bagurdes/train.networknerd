"use client";

import { Button } from "@/components/ui/button";
import { deleteClassAction } from "@/features/classes/actions";

export function DeleteClassButton({ id, name }: { id: string; name: string }) {
  async function handleDelete() {
    if (!confirm(`Delete class "${name}"? This will remove all memberships.`)) return;
    await deleteClassAction(id);
  }

  return (
    <Button size="sm" variant="destructive" onClick={handleDelete}>
      Delete
    </Button>
  );
}
