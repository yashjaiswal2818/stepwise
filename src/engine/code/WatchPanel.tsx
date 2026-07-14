"use client";

import { usePlayer } from "../player/store";

/** Scalar watch values for the current step (i, j, low, high, sum…). */
export function WatchPanel() {
  const vars = usePlayer((s) => s.trace?.steps[s.index]?.vars);
  const entries = vars ? Object.entries(vars) : [];
  if (!entries.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 px-4 pb-3">
      {entries.map(([k, v]) => (
        <span
          key={k}
          className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface-2 px-2 py-1 font-mono text-[11px]"
        >
          <span className="text-fg-faint">{k}</span>
          <span className="text-fg">{String(v)}</span>
        </span>
      ))}
    </div>
  );
}
