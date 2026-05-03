"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deleteCourseAction } from "@/features/courses/actions";

/**
 * Inline delete button with a native `confirm()`. Plenty for now — when we
 * have a Dialog primitive we'll replace this with a proper confirmation modal.
 */
export function DeleteCourseButton({ id, title }: { id: string; title: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      size="sm"
      variant="destructive"
      disabled={pending}
      onClick={() => {
        if (!confirm(`Delete "${title}"? Modules and questions will be removed.`)) return;
        startTransition(async () => {
          await deleteCourseAction(id);
        });
      }}
    >
      {pending ? "Deleting…" : "Delete"}
    </Button>
  );
}
