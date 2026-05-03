import { cn } from "@/lib/utils";

/** Inline error message under a form field or above a form. */
export function FormError({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  if (!children) return null;
  return (
    <p
      className={cn("text-sm text-destructive", className)}
      role="alert"
      aria-live="polite"
    >
      {children}
    </p>
  );
}

/** Inline success message. */
export function FormSuccess({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  if (!children) return null;
  return (
    <p
      className={cn("text-sm text-accent", className)}
      role="status"
      aria-live="polite"
    >
      {children}
    </p>
  );
}
