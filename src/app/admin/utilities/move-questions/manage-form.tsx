"use client";

import { useActionState, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";
import { cn } from "@/lib/utils";
import {
  moveOrCopyQuestionsAction,
  type FormState,
} from "@/features/questions/actions";

interface QuestionItem {
  id: string;
  prompt: string;
  order: number;
}

interface DestinationItem {
  id: string;
  title: string;
  questionCount: number;
}

const initial: FormState = {};

export function ManageForm({
  sourceModuleId,
  sourceTitle,
  questions,
  destinations,
  moveDisabled,
  moveDisabledReason,
}: {
  sourceModuleId: string;
  sourceTitle: string;
  questions: QuestionItem[];
  destinations: DestinationItem[];
  moveDisabled: boolean;
  moveDisabledReason: string | null;
}) {
  const [state, formAction] = useActionState(moveOrCopyQuestionsAction, initial);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [destinationKind, setDestinationKind] = useState<"existing" | "new">(
    destinations.length > 0 ? "existing" : "new",
  );
  const [existingId, setExistingId] = useState<string>("");
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");

  function toggle(id: string, next: boolean) {
    setSelected((prev) => {
      const nextSet = new Set(prev);
      if (next) nextSet.add(id);
      else nextSet.delete(id);
      return nextSet;
    });
  }
  function selectAll() {
    setSelected(new Set(questions.map((q) => q.id)));
  }
  function selectNone() {
    setSelected(new Set());
  }

  const selectedCount = selected.size;
  const destinationReady =
    destinationKind === "existing" ? existingId !== "" : newTitle.trim() !== "";

  const canSubmit = selectedCount > 0 && destinationReady;
  const canMove = canSubmit && !moveDisabled;

  const selectedPrompts = useMemo(
    () =>
      questions
        .filter((q) => selected.has(q.id))
        .map((q) => q.prompt.slice(0, 80))
        .slice(0, 3),
    [questions, selected],
  );

  return (
    <form action={formAction} className="space-y-6">
      {/* Hidden metadata */}
      <input type="hidden" name="sourceModuleId" value={sourceModuleId} />
      <input type="hidden" name="destinationKind" value={destinationKind} />
      {/* operation is set per submit button via name/value */}

      {/* -- Question list -- */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Questions in {sourceTitle}
          </h2>
          <div className="flex items-center gap-2 text-sm">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={selectAll}
              disabled={selectedCount === questions.length}
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
            <span className="text-muted-foreground">
              {selectedCount} of {questions.length} selected
            </span>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card divide-y divide-border">
          {questions.map((q) => {
            const checked = selected.has(q.id);
            return (
              <label
                key={q.id}
                className={cn(
                  "flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors",
                  checked ? "bg-primary/5" : "hover:bg-muted/40",
                )}
              >
                <input
                  type="checkbox"
                  name="questionIds"
                  value={q.id}
                  checked={checked}
                  onChange={(e) => toggle(q.id, e.currentTarget.checked)}
                  className="mt-1 h-4 w-4 accent-primary"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-mono text-muted-foreground mb-0.5">
                    #{q.order}
                  </div>
                  <div className="text-sm line-clamp-2 whitespace-pre-wrap">
                    {q.prompt}
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </section>

      {/* -- Destination -- */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Destination
        </h2>

        <div className="space-y-3 rounded-lg border border-border bg-card p-4">
          {/* Existing module option */}
          <div className="space-y-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="destinationKindRadio"
                value="existing"
                checked={destinationKind === "existing"}
                onChange={() => setDestinationKind("existing")}
                disabled={destinations.length === 0}
                className="mt-1 h-4 w-4 accent-primary"
              />
              <div className="flex-1">
                <div className="font-medium">Existing module</div>
                <div className="text-xs text-muted-foreground">
                  Only modules not in any course and not archived are listed here.
                </div>
              </div>
            </label>
            {destinationKind === "existing" && (
              <div className="pl-7">
                {destinations.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No eligible existing modules — all other modules are either archived
                    or in a course. Create a new module below instead.
                  </p>
                ) : (
                  <select
                    name="destinationModuleId"
                    value={existingId}
                    onChange={(e) => setExistingId(e.currentTarget.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
                  >
                    <option value="">Choose a destination module…</option>
                    {destinations.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.title} ({d.questionCount} question
                        {d.questionCount === 1 ? "" : "s"})
                      </option>
                    ))}
                  </select>
                )}
                <FormError>{state.fieldErrors?.destinationModuleId?.[0]}</FormError>
              </div>
            )}
          </div>

          {/* New module option */}
          <div className="space-y-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="destinationKindRadio"
                value="new"
                checked={destinationKind === "new"}
                onChange={() => setDestinationKind("new")}
                className="mt-1 h-4 w-4 accent-primary"
              />
              <div className="flex-1">
                <div className="font-medium">New module</div>
                <div className="text-xs text-muted-foreground">
                  Creates a new standalone module. Assign it to a course later.
                </div>
              </div>
            </label>
            {destinationKind === "new" && (
              <div className="pl-7 space-y-2">
                <div>
                  <Label htmlFor="newModuleTitle">Title</Label>
                  <Input
                    id="newModuleTitle"
                    name="newModuleTitle"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.currentTarget.value)}
                    placeholder="e.g. Advanced capture filters"
                  />
                  <FormError>{state.fieldErrors?.newModuleTitle?.[0]}</FormError>
                </div>
                <div>
                  <Label htmlFor="newModuleDescription">
                    Description (optional)
                  </Label>
                  <Textarea
                    id="newModuleDescription"
                    name="newModuleDescription"
                    rows={2}
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.currentTarget.value)}
                    placeholder="Short description shown on the module page."
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {moveDisabled && moveDisabledReason && (
        <div className="rounded-lg border border-secondary/40 bg-secondary/10 p-4 text-sm">
          <strong>Move is disabled for this source.</strong>{" "}
          {moveDisabledReason}{" "}
          <span className="text-muted-foreground">Copy is still available.</span>
        </div>
      )}

      <FormError>{state.error}</FormError>

      {/* Selected preview */}
      {selectedPrompts.length > 0 && (
        <div className="rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
          <strong>About to act on:</strong>{" "}
          {selectedPrompts.map((p, i) => (
            <span key={i}>
              &ldquo;{p}
              {p.length === 80 ? "…" : ""}&rdquo;
              {i < selectedPrompts.length - 1 ? ", " : ""}
            </span>
          ))}
          {selectedCount > 3 && ` and ${selectedCount - 3} more…`}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-4">
        <Button
          type="submit"
          name="operation"
          value="copy"
          variant="outline"
          disabled={!canSubmit}
        >
          Copy selected
        </Button>
        <Button
          type="submit"
          name="operation"
          value="move"
          disabled={!canMove}
          title={moveDisabled && moveDisabledReason ? moveDisabledReason : undefined}
        >
          Move selected
        </Button>
      </div>
    </form>
  );
}
