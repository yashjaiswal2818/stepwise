"use client";

import { useState } from "react";
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
 *
 * The WHY register ("Because") renders beneath the narration when the step
 * carries one. Disclosure differs by surface, on purpose:
 * - Lessons pass `whyMode="inline"` — a chapter is expository, the reason is
 *   part of the text.
 * - Problems default to `whyMode="toggle"` — the learner is invited to supply
 *   the reason themselves before reading it (the generation effect); the
 *   affordance re-collapses on every step so each move re-poses the question.
 * An absent `why` hides the register entirely — never an empty placeholder.
 */
export function Narration({ whyMode = "toggle" }: { whyMode?: "inline" | "toggle" }) {
  const narration = usePlayer((s) => s.trace?.steps[s.index]?.narration ?? "");
  const why = usePlayer((s) => s.trace?.steps[s.index]?.why);
  const index = usePlayer((s) => s.index);

  // "Revealed" is per-step by definition, so it is DERIVED from the step index
  // rather than reset by an effect: advancing invalidates the reveal for free.
  const [revealedFor, setRevealedFor] = useState(-1);
  const revealed = revealedFor === index;

  const showWhy = !!why && (whyMode === "inline" || revealed);

  return (
    <div className="shrink-0 border-t border-line px-5 py-4 sm:px-6">
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <p className="text-2xs font-medium tracking-tight text-fg-faint">Now</p>
        {whyMode === "toggle" && !!why && !revealed && (
          <button
            type="button"
            onClick={() => setRevealedFor(index)}
            aria-expanded={false}
            className="text-xs font-medium text-fg-muted hover:text-fg"
          >
            Why?
          </button>
        )}
      </div>
      <p className="flex min-h-12 max-w-prose items-start text-pretty text-md leading-relaxed text-fg">
        {narration || "—"}
      </p>
      {showWhy && (
        <div className="mt-2 border-t border-line pt-2">
          <p className="mb-1 text-2xs font-medium tracking-tight text-fg-faint">Because</p>
          <p className="max-w-prose text-pretty text-md leading-relaxed text-fg-muted">{why}</p>
        </div>
      )}
    </div>
  );
}
