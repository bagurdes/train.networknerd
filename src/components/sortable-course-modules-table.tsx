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
import { reorderCourseModulesAction } from "@/features/modules/actions";
import { UnassignModuleButton } from "@/app/admin/courses/[id]/unassign-module-button";
import { DeleteModuleButton } from "@/app/admin/courses/[id]/delete-module-button";

/**
 * Each row represents one module inside the current course. `id` here is the
 * CourseModule row id (the join-table row), not the Module id — that's what
 * reorderCourseModules operates on.
 */
export interface SortableCourseModuleRow {
  /** CourseModule row id — used for drag sort key. */
  id: string;
  /** Module id — used for edit / questions links. */
  moduleId: string;
  title: string;
  description: string;
  questionCount: number;
}

export function SortableCourseModulesTable({
  courseId,
  modules,
}: {
  courseId: string;
  modules: SortableCourseModuleRow[];
}) {
  const { order, pending, dragIndex, rowProps } = useSortable({
    items: modules,
    onReorder: (ids) => reorderCourseModulesAction(courseId, ids),
  });

  return (
    <div className={cn("rounded-lg border border-border bg-card", pending && "opacity-70")}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8"></TableHead>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Title</TableHead>
            <TableHead className="hidden md:table-cell">Questions</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {order.map((m, i) => (
            <TableRow
              key={m.id}
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
              <TableCell>
                <div className="font-medium">{m.title}</div>
                <div className="text-xs text-muted-foreground line-clamp-1">
                  {m.description}
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">{m.questionCount}</TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/admin/courses/${courseId}/modules/${m.moduleId}/questions`}>
                      Questions ({m.questionCount})
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link
                      href={`/admin/courses/${courseId}/modules/${m.moduleId}/questions/new`}
                    >
                      + Question
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/admin/courses/${courseId}/modules/${m.moduleId}/edit`}>
                      Edit
                    </Link>
                  </Button>
                  <UnassignModuleButton
                    courseId={courseId}
                    moduleId={m.moduleId}
                    title={m.title}
                  />
                  <DeleteModuleButton id={m.moduleId} courseId={courseId} title={m.title} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
