"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useSortable } from "@/components/use-sortable";
import { reorderQuestionsAction } from "@/features/questions/actions";

export interface SortableQuestionsRow {
  id: string;
  prompt: string;
  order: number;
}

export function SortableQuestionsTable({
  questions,
  moduleId,
  courseId,
}: {
  questions: SortableQuestionsRow[];
  moduleId: string;
  /** Null when editing from the standalone module page. */
  courseId: string | null;
}) {
  const { order, pending, dragIndex, rowProps } = useSortable({
    items: questions,
    onReorder: (ids) => reorderQuestionsAction(moduleId, courseId, ids),
  });

  const editHrefFor = (qId: string) =>
    courseId
      ? `/admin/courses/${courseId}/modules/${moduleId}/questions/${qId}/edit`
      : `/admin/modules/${moduleId}/questions/${qId}/edit`;

  return (
    <div className={cn("rounded-lg border border-border bg-card", pending && "opacity-70")}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8"></TableHead>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Question</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {order.map((q, i) => (
            <TableRow
              key={q.id}
              {...rowProps(i)}
              className={cn(
                "cursor-grab active:cursor-grabbing",
                dragIndex === i && "bg-muted/60",
              )}
            >
              <TableCell className="select-none text-muted-foreground text-lg leading-none">
                ⋮⋮
              </TableCell>
              <TableCell className="text-muted-foreground font-mono text-sm">
                {i + 1}
              </TableCell>
              <TableCell className="font-medium">
                <span className="line-clamp-2 whitespace-pre-wrap">{q.prompt}</span>
              </TableCell>
              <TableCell className="text-right">
                <Button asChild size="sm" variant="outline">
                  <Link href={editHrefFor(q.id)}>Edit</Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
