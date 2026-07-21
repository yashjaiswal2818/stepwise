"use client";

import { usePlayer } from "../player/store";

/**
 * The teacher's voice for the current step. It now sits as a caption directly
 * beneath the canvas — not in a cramped strip under the code — so a learner reads
 * *what is happening* right where they are watching it happen.
 *
 * Two deliberate choices carry the readability: the narration is prose, so it is
 * set in SANS (mono in this product is for numerics), and it is sized up to the
 * reading step and capped at a comfortable measure. The canvas already exposes the
 * same string to assistive tech via its role="img" label, so this is intentionally
 * NOT a second live region — a polite region updated several times a second floods
 * the screen-reader queue faster than it can be spoken.
 */
export function Narration() {
  const narration = usePlayer((s) => s.trace?.steps[s.index]?.narration ?? "");

  return (
    <div className="shrink-0 border-t border-line px-5 py-4 sm:px-6">
      <p className="mb-1.5 text-2xs font-medium tracking-tight text-fg-faint">Now</p>
      <p className="flex min-h-12 max-w-prose items-start text-pretty text-md leading-relaxed text-fg">
        {narration || "—"}
      </p>
    </div>
  );
}
