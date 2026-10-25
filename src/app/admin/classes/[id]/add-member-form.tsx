"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormError } from "@/components/ui/form-error";
import { addMembersAction, type FormState } from "@/features/classes/actions";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  verified: boolean;
  /** Number of classes the user is in (any class). */
  classCount: number;
  alreadyEnrolled: boolean;
}

const initialState: FormState = {};
const MAX_SHOWN = 50;

/**
 * Manually add people to a class. Search by name or email instead of scrolling
 * the whole user list. Users already in this class are left out.
 *
 * Rows hidden by the search stay mounted (CSS-hidden), and checked rows stay
 * visible, so a selection survives changing the search text.
 */
export function AddMembersForm({ classId, users }: { classId: string; users: User[] }) {
  const action = addMembersAction.bind(null, classId);
  const [state, formAction] = useActionState(action, initialState);
  const [query, setQuery] = useState("");
  const [onlyUnassigned, setOnlyUnassigned] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Clear the selection after a successful add (keep it if the add failed).
  useEffect(() => {
    if (state.ok) setSelected(new Set());
  }, [state]);

  const available = useMemo(() => users.filter((u) => !u.alreadyEnrolled), [users]);

  const visibleIds = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = available.filter(
      (u) =>
        (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) &&
        (!onlyUnassigned || u.classCount === 0),
    );
    return new Set(matches.slice(0, MAX_SHOWN).map((u) => u.id));
  }, [available, query, onlyUnassigned]);

  const matchCount = useMemo(() => {
    const q = query.trim().toLowerCase();
    return available.filter(
      (u) =>
        (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) &&
        (!onlyUnassigned || u.classCount === 0),
    ).length;
  }, [available, query, onlyUnassigned]);

  function toggle(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  return (
    <form action={formAction} className="space-y-3">
      <Input
        type="search"
        placeholder="Search name or email…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search users"
      />
      <label className="flex items-center gap-2 text-xs text-muted-foreground">
        <input
          type="checkbox"
          checked={onlyUnassigned}
          onChange={(e) => setOnlyUnassigned(e.target.checked)}
          className="h-3.5 w-3.5 rounded border-border"
        />
        Only people not in any class
      </label>

      <div className="space-y-1 max-h-80 overflow-y-auto">
        {available.length === 0 && (
          <p className="text-sm text-muted-foreground">Everyone is already in this class.</p>
        )}
        {available.length > 0 && matchCount === 0 && (
          <p className="text-sm text-muted-foreground">No matches.</p>
        )}

        {available.map((u) => (
          <label
            key={u.id}
            className={
              !visibleIds.has(u.id) && !selected.has(u.id)
                ? "hidden"
                : "flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted cursor-pointer"
            }
          >
            <input
              type="checkbox"
              name="userIds"
              value={u.id}
              checked={selected.has(u.id)}
              onChange={(e) => toggle(u.id, e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{u.name}</div>
              <div className="text-xs text-muted-foreground truncate">{u.email}</div>
            </div>
            <span className="text-xs text-muted-foreground shrink-0 text-right">
              {u.role.toLowerCase()}
              {!u.verified && <span className="block text-destructive">unverified</span>}
            </span>
          </label>
        ))}

        {matchCount > MAX_SHOWN && (
          <p className="text-xs text-muted-foreground px-2">
            Showing {MAX_SHOWN} of {matchCount}. Type to narrow it down.
          </p>
        )}
      </div>

      {state.ok && (
        <p className="text-sm text-green-600">{state.error ?? "Members added."}</p>
      )}
      {!state.ok && <FormError>{state.error}</FormError>}

      {available.length > 0 && (
        <SubmitButton pendingText="Adding…" disabled={selected.size === 0}>
          {selected.size > 0 ? `Add ${selected.size} as students` : "Add selected as students"}
        </SubmitButton>
      )}
    </form>
  );
}
