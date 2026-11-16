import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Network Nerd logo.
 *
 * Two variants:
 *   - "icon" → just the circular character (public/icon.png). Square-ish
 *     aspect. Use in the site header and anywhere space is tight.
 *   - "full" → character + "Network Nerd" wordmark (public/logo.png). Tall
 *     aspect. Use on the landing page and auth card tops.
 *
 * Height is set by Tailwind height classes; `w-auto` preserves aspect ratio.
 * Default heights are set per variant but overridable via `className`.
 */
interface LogoProps {
  variant?: "full" | "icon";
  className?: string;
  /** Pass true for above-the-fold logos so Next prioritizes the request. */
  priority?: boolean;
}

export function Logo({ variant = "full", className, priority = false }: LogoProps) {
  if (variant === "icon") {
    return (
      <Image
        src="/icon.png"
        alt="Network Nerd"
        width={1424}
        height={1374}
        priority={priority}
        className={cn("h-9 w-auto", className)}
      />
    );
  }
  return (
    <Image
      src="/logo.png"
      alt="Network Nerd"
      width={1708}
      height={2219}
      priority={priority}
      className={cn("h-32 w-auto", className)}
    />
  );
}
