"use client";

import { usePlayer } from "../player/store";

/** The always-on, plain-English explanation of the current step. */
export function Narration() {
  const narration = usePlayer((s) => s.trace?.steps[s.index]?.narration ?? "");
  return (
    <div aria-live="polite" className="flex items-start gap-2 border-t border-line px-4 py-3">
      <span className="mt-px text-fg-faint">→</span>
      <p className="font-mono text-sm leading-relaxed text-fg">{narration || "—"}</p>
    </div>
  );
}
