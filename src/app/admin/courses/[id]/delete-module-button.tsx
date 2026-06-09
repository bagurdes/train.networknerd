"use client";

import { Button } from "@/components/ui/button";
import { deleteModuleAction } from "@/features/modules/actions";

export function DeleteModuleButton({
  id,
  courseId,
  title,
}: {
  id: string;
  courseId: string;
  title: string;
}) {
  async function handleDelete() {
    if (!confirm(`Delete module "${title}"? This will also delete all its questions.`)) return;
    await deleteModuleAction(id, courseId);
  }

  return (
    <Button
      size="sm"
      variant="destructive"
      onClick={handleDelete}
    >
      Delete
    </Button>
  );
}
