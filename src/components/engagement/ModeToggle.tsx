"use client";

import { useProgress, type Mode } from "@/engagement/useProgress";
import { useMounted } from "@/lib/useMounted";
import { cn } from "@/lib/utils";

const MODES: { id: Mode; label: string }[] = [
  { id: "beginner", label: "Beginner" },
  { id: "interview", label: "Interview" },
];

/**
 * Responsive visibility is the caller's decision, not this component's — the
 * navbar shows it inline on desktop and inside the mobile sheet on a phone, and
 * a hard-coded `hidden md:flex` in here made the second one impossible.
 */
export function ModeToggle({ className }: { className?: string }) {
  const mode = useProgress((s) => s.mode);
  const setMode = useProgress((s) => s.setMode);
  const mounted = useMounted();
  const active = mounted ? mode : "beginner";

  return (
    <div
      className={cn("items-center rounded-lg border border-line bg-surface-2 p-0.5", className)}
      role="group"
      aria-label="Learning mode"
    >
      {MODES.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => setMode(m.id)}
          aria-pressed={active === m.id}
          className={cn(
            // Concentric with the rounded-lg (10px) shell minus its 2px pad.
            "rounded-md px-2.5 py-1 text-xs transition-colors duration-[var(--duration-fast)] ease-out",
            active === m.id
              ? "bg-surface-3 font-semibold text-fg shadow-[var(--lift)]"
              : "font-medium text-fg-muted hover:text-fg",
          )}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
