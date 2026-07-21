import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/**
 * A keycap. Not interactive — it labels a shortcut, it does not invoke one — so
 * it deliberately takes no focus ring and no press state.
 *
 * `rounded-xs` (3px) is the kbd step on the radius scale, and `--lift` gives it
 * the 1px top highlight that reads as a physical key catching light.
 */
export function Kbd({ className, ...props }: ComponentProps<"kbd">) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-xs",
        "border border-line-strong bg-surface-2 shadow-[var(--lift)]",
        "px-1.5 font-mono text-2xs font-medium text-fg-muted",
        className,
      )}
      {...props}
    />
  );
}
