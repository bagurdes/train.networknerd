"use client";

import { Button } from "@/components/ui/button";
import { deleteQuestionAction } from "@/features/questions/actions";

export function DeleteQuestionButton({
  id,
  moduleId,
  courseId,
}: {
  id: string;
  moduleId: string;
  courseId: string;
}) {
  async function handleDelete() {
    if (!confirm("Delete this question? This cannot be undone.")) return;
    await deleteQuestionAction(id, moduleId, courseId);
  }

  return (
    <Button size="sm" variant="destructive" onClick={handleDelete}>
      Delete question
    </Button>
  );
}
