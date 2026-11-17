"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  archiveModuleAction,
  copyModuleAction,
  unarchiveModuleAction,
} from "@/features/modules/actions";

/**
 * Inline Copy + Archive/Unarchive buttons for a module row.
 * Wrapped in useTransition so the pending state disables the buttons while
 * the server action runs.
 */
export function ModuleRowActions({
  id,
  title,
  archived,
  usedInCourses,
}: {
  id: string;
  title: string;
  archived: boolean;
  /** How many courses currently reference this module. Used in confirm copy. */
  usedInCourses: number;
}) {
  const [pending, startTransition] = useTransition();

  function onCopy() {
    startTransition(async () => {
      await copyModuleAction(id);
    });
  }

  function onArchive() {
    const suffix =
      usedInCourses > 0
        ? ` It will stay in ${usedInCourses} course${usedInCourses === 1 ? "" : "s"} already using it.`
        : "";
    if (!confirm(`Archive "${title}"?${suffix} You can restore it from the Archived tab.`)) {
      return;
    }
    startTransition(async () => {
      await archiveModuleAction(id);
    });
  }

  function onUnarchive() {
    startTransition(async () => {
      await unarchiveModuleAction(id);
    });
  }

  if (archived) {
    return (
      <Button type="button" size="sm" variant="outline" disabled={pending} onClick={onUnarchive}>
        {pending ? "Restoring…" : "Restore"}
      </Button>
    );
  }

  return (
    <>
      <Button type="button" size="sm" variant="outline" disabled={pending} onClick={onCopy}>
        {pending ? "Copying…" : "Copy"}
      </Button>
      <Button type="button" size="sm" variant="outline" disabled={pending} onClick={onArchive}>
        Archive
      </Button>
    </>
  );
}
