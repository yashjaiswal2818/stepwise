"use client";

import { Flame } from "lucide-react";
import { useProgress } from "@/engagement/useProgress";
import { useMounted } from "@/lib/useMounted";
import { Badge } from "@/design-system/ui/Badge";

/**
 * A streak is information, never the point — so it is drawn in chrome, and it is
 * the shared `Badge` rather than a hand-rolled copy of one. The flame used to be
 * tinted with `--medium` (the amber difficulty token, which aliases
 * `--state-active`); chroma in this system means algorithm state, and a streak is
 * not one.
 *
 * `title` is not an accessible name on a span, so the unit is spelled out for
 * assistive tech and the glyph is hidden from it: this reads as "3 day streak".
 *
 * Responsive visibility is the caller's call — the navbar hides it on the
 * narrowest widths and re-exposes it inside the mobile sheet.
 */
export function NavStreak({ className }: { className?: string }) {
  const streak = useProgress((s) => s.streak);
  const mounted = useMounted();
  if (!mounted || streak < 1) return null;

  return (
    <Badge className={className} title={`${streak}-day streak`}>
      <Flame className="size-3.5 shrink-0" aria-hidden />
      <span className="font-mono">{streak}</span>
      <span className="sr-only">day streak</span>
    </Badge>
  );
}
