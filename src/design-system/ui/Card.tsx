import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/**
 * Elevation, per DESIGN.md: hairlines and inset highlights, never a soft drop
 * shadow. `raised` is the default because a card sitting on the page is the
 * common case; `sunken` is for a region recessed *into* a card (an inset panel,
 * a readout), which reads as lower, so it takes no lift.
 */
type Elevation = "flat" | "raised" | "sunken";
type Padding = "none" | "sm" | "md" | "lg";

const elevations: Record<Elevation, string> = {
  flat: "border border-line bg-surface",
  raised: "border border-line bg-surface shadow-[var(--lift)]",
  sunken: "border border-line bg-surface-2",
};

const paddings: Record<Padding, string> = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

/**
 * Class string only, mirroring `buttonVariants`. This is what lets a link or a
 * `<section>` take the card treatment without Card needing a polymorphic `as`
 * prop — several existing call sites are `<Link>`s wrapping card chrome.
 */
export function cardVariants({
  elevation = "raised",
  padding = "md",
}: { elevation?: Elevation; padding?: Padding } = {}) {
  /* rounded-lg (10px) is the card/panel step on the radius scale. */
  return cn("rounded-lg", elevations[elevation], paddings[padding]);
}

export function Card({
  elevation,
  padding,
  className,
  ...props
}: ComponentProps<"div"> & { elevation?: Elevation; padding?: Padding }) {
  return (
    <div
      className={cn(cardVariants({ elevation, padding }), className)}
      {...props}
    />
  );
}
