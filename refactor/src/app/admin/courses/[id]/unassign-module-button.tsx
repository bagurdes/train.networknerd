"use client";

import { Button } from "@/components/ui/button";
import { unassignModuleAction } from "@/features/modules/actions";

export function UnassignModuleButton({
  courseId,
  moduleId,
  title,
}: {
  courseId: string;
  moduleId: string;
  title: string;
}) {
  async function handleUnassign() {
    if (
      !confirm(
        `Remove "${title}" from this course? The module itself will not be deleted and can be added to other courses.`,
      )
    )
      return;
    await unassignModuleAction(courseId, moduleId);
  }

  return (
    <Button size="sm" variant="outline" onClick={handleUnassign}>
      Remove
    </Button>
  );
}
