"use client";

import { useEffect, useRef, useState, useTransition, type DragEvent } from "react";

/**
 * Minimal drag-and-drop sortable hook using native HTML5 drag events.
 *
 * Why native and not a library: adding a new npm dep would require updating
 * package-lock.json locally, which doesn't fit this project's push-only
 * workflow. Native HTML5 drag covers mouse-based reordering well enough for
 * an admin UI; we can swap in dnd-kit later if we need keyboard/touch.
 *
 * Usage:
 *   const { order, pending, dragIndex, rowProps } = useSortable({
 *     items: questions,
 *     onReorder: (ids) => reorderQuestionsAction(moduleId, courseId, ids),
 *   });
 *   return order.map((q, i) => <tr key={q.id} {...rowProps(i)}>...</tr>);
 *
 * Optimistic: the local order updates immediately as you drag. On drop, the
 * server action fires via useTransition; if it fails, we roll back.
 */
export function useSortable<T extends { id: string }>({
  items,
  onReorder,
}: {
  items: T[];
  onReorder: (orderedIds: string[]) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [order, setOrder] = useState<T[]>(items);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();
  const idsKey = items.map((i) => i.id).join("|");
  const lastSyncedKey = useRef(idsKey);

  // Re-sync when the server returns a different set/order (e.g. after
  // revalidation or a successful reorder from elsewhere). Never sync
  // mid-drag or mid-transition — that would fight the user.
  useEffect(() => {
    if (dragIndex !== null || pending) return;
    if (idsKey === lastSyncedKey.current) return;
    lastSyncedKey.current = idsKey;
    setOrder(items);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, dragIndex, pending]);

  function onDragStart(e: DragEvent, index: number) {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
    // Firefox requires setData for drag to start.
    e.dataTransfer.setData("text/plain", String(index));
  }

  function onDragOver(e: DragEvent, index: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragIndex === null || dragIndex === index) return;
    const next = order.slice();
    const [moved] = next.splice(dragIndex, 1);
    if (!moved) return;
    next.splice(index, 0, moved);
    setOrder(next);
    setDragIndex(index);
  }

  function onDragEnd() {
    if (dragIndex === null) return;
    const newIds = order.map((i) => i.id);
    const oldIds = items.map((i) => i.id);
    setDragIndex(null);
    const changed = newIds.some((id, i) => id !== oldIds[i]);
    if (!changed) return;

    const snapshot = items;
    startTransition(async () => {
      const result = await onReorder(newIds);
      if (!result.ok) {
        setOrder(snapshot);
        // Keep this inline so the admin sees it; alert is fine for v1.
        alert(result.error ?? "Failed to reorder");
      }
    });
  }

  return {
    order,
    pending,
    dragIndex,
    rowProps: (index: number) => ({
      draggable: true,
      onDragStart: (e: DragEvent) => onDragStart(e, index),
      onDragOver: (e: DragEvent) => onDragOver(e, index),
      onDragEnd,
    }),
  };
}
