"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ModuleItem {
  id: string;
  title: string;
  questions: number;
  courses: string[];
}

/**
 * Checkbox list of modules + two download buttons.
 *
 * Form method is GET — the browser handles the download natively because the
 * API response sets `Content-Disposition: attachment`. The two submit buttons
 * share the form but each sends a different `type` value (questions / answers).
 */
export function DownloadQAForm({
  modules,
  archivedTab,
}: {
  modules: ModuleItem[];
  archivedTab: boolean;
}) {
  // Local checked state — the form inputs stay controlled so we can offer
  // Select All / None conveniences and disable the download buttons when the
  // selection is empty.
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(id: string, next: boolean) {
    setSelected((prev) => {
      const nextSet = new Set(prev);
      if (next) nextSet.add(id);
      else nextSet.delete(id);
      return nextSet;
    });
  }

  function selectAll() {
    setSelected(new Set(modules.map((m) => m.id)));
  }
  function selectNone() {
    setSelected(new Set());
  }

  const selectedCount = selected.size;
  const allSelected = modules.length > 0 && selectedCount === modules.length;

  const noneToShow = modules.length === 0;
  const totalQuestions = useMemo(
    () => modules.filter((m) => selected.has(m.id)).reduce((sum, m) => sum + m.questions, 0),
    [modules, selected],
  );

  if (noneToShow) {
    return (
      <div className="rounded-lg border border-border bg-card p-10 text-center text-muted-foreground">
        <p>
          No {archivedTab ? "archived" : "active"} modules{" "}
          {archivedTab ? "." : "to export yet."}
        </p>
      </div>
    );
  }

  return (
    <form action="/api/modules/export" method="GET" className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={selectAll}
            disabled={allSelected}
          >
            Select all
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={selectNone}
            disabled={selectedCount === 0}
          >
            Select none
          </Button>
          <span className="text-muted-foreground ml-2">
            {selectedCount} of {modules.length} selected
            {selectedCount > 0 && ` · ${totalQuestions} question${totalQuestions === 1 ? "" : "s"} total`}
          </span>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card divide-y divide-border">
        {modules.map((m) => {
          const checked = selected.has(m.id);
          return (
            <label
              key={m.id}
              className={cn(
                "flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors",
                checked ? "bg-primary/5" : "hover:bg-muted/40",
              )}
            >
              <input
                type="checkbox"
                name="ids"
                value={m.id}
                checked={checked}
                onChange={(e) => toggle(m.id, e.currentTarget.checked)}
                className="mt-1 h-4 w-4 accent-primary"
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium">{m.title}</div>
                <div className="text-xs text-muted-foreground">
                  {m.questions} question{m.questions === 1 ? "" : "s"}
                  {m.courses.length > 0 && (
                    <> · In: {m.courses.join(", ")}</>
                  )}
                </div>
              </div>
            </label>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-4">
        <p className="text-xs text-muted-foreground mr-auto">
          Downloads as one combined plain-text file. Open in any editor; sized
          for pasting into a doc or printing.
        </p>
        <Button
          type="submit"
          name="type"
          value="questions"
          variant="outline"
          disabled={selectedCount === 0}
        >
          ⬇ Download Questions
        </Button>
        <Button
          type="submit"
          name="type"
          value="answers"
          disabled={selectedCount === 0}
        >
          ⬇ Download Answer Keys
        </Button>
      </div>
    </form>
  );
}
