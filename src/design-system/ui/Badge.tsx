import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/**
 * A neutral metadata chip. `rounded-sm` (5px) is the badge step on the radius
 * scale in globals.css; a pill is a different, unscaled shape.
 *
 * text-fg-muted on surface-2 measures 6.91:1 dark / 6.22:1 light.
 */
export function Badge({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border border-line bg-surface-2",
        "px-2 py-0.5 text-xs font-medium text-fg-muted",
        className,
      )}
      {...props}
    />
  );
}

const diffDot = {
  Easy: "bg-easy",
  Medium: "bg-medium",
  Hard: "bg-hard",
} as const;

export type Difficulty = keyof typeof diffDot;

/**
 * Difficulty encoded as a colour, per the --easy/--medium/--hard tokens.
 *
 * The colour is carried by the DOT, not the text. That is a contrast decision,
 * computed rather than eyeballed against the OKLCH values in globals.css:
 *
 *   The previous `text-{level} on bg-{level}/10` failed 4.5:1 on EVERY surface
 *   in the light theme — Easy 4.44, Hard 3.26, Medium 2.77 (worst case 2.35 on
 *   surface-3) — and Hard also failed on surface-3 in dark at 3.96. Setting the
 *   saturated colour as text does not rescue it either: on light `--medium`
 *   tops out at 3.06:1 and `--hard` at 3.65:1. That is not a bug in the values,
 *   it is what they are for — the palette solver constrains the light theme to
 *   >=3:1 as a *graphical object*, never 4.5:1 as text, which is exactly why
 *   light mode uses tinted fills and saturated strokes elsewhere.
 *
 *   So: the label is `text-fg` (14.84:1 dark / 16.67:1 light) and the hue moves
 *   to a dot, which only owes 3:1. `bg-surface` on the chip is deliberate and
 *   is what makes that clear in both themes — the dot measures Easy 8.97 /
 *   Medium 12.04 / Hard 6.06 on dark surface, and Easy 5.08 / Medium 3.06 /
 *   Hard 3.65 on light surface. On surface-2 the light Medium dot drops to
 *   2.79 and misses, so this chip must not sit on a tinted background.
 *
 * The word is the primary channel and the hue is redundant reinforcement, which
 * is the DESIGN.md rule ("hue is never the only channel") applied to chrome.
 * The border stays `border-line`: a saturated border here measured 1.36–1.98:1,
 * invisible in both themes, and chrome is not where chroma gets spent.
 */
export function DifficultyTag({
  level,
  className,
}: {
  level: Difficulty;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border border-line bg-surface",
        "px-2 py-0.5 text-xs font-medium text-fg",
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", diffDot[level])} />
      {level}
    </span>
  );
}
