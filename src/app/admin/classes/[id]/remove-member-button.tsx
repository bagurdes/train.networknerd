"use client";

import { Button } from "@/components/ui/button";
import { removeMemberAction } from "@/features/classes/actions";

export function RemoveMemberButton({
  classId,
  userId,
  name,
}: {
  classId: string;
  userId: string;
  name: string;
}) {
  async function handleRemove() {
    if (!confirm(`Remove ${name} from this class?`)) return;
    await removeMemberAction(classId, userId);
  }

  return (
    <Button size="sm" variant="outline" onClick={handleRemove}>
      Remove
    </Button>
  );
}
