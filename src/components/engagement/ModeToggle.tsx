"use client";

import { useProgress, type Mode } from "@/engagement/useProgress";
import { useMounted } from "@/lib/useMounted";
import { cn } from "@/lib/utils";

const MODES: { id: Mode; label: string }[] = [
  { id: "beginner", label: "Beginner" },
  { id: "interview", label: "Interview" },
];

export function ModeToggle() {
  const mode = useProgress((s) => s.mode);
  const setMode = useProgress((s) => s.setMode);
  const mounted = useMounted();
  const active = mounted ? mode : "beginner";

  return (
    <div className="hidden items-center rounded-lg border border-line bg-surface-2 p-0.5 md:flex" role="group" aria-label="Learning mode">
      {MODES.map((m) => (
        <button
          key={m.id}
          onClick={() => setMode(m.id)}
          aria-pressed={active === m.id}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
            active === m.id ? "bg-brand text-brand-fg" : "text-fg-muted hover:text-fg",
          )}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
