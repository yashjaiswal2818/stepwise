"use client";

import { Flame } from "lucide-react";
import { useProgress } from "@/engagement/useProgress";
import { useMounted } from "@/lib/useMounted";

export function NavStreak() {
  const streak = useProgress((s) => s.streak);
  const mounted = useMounted();
  if (!mounted || streak < 1) return null;
  return (
    <span
      className="hidden items-center gap-1 rounded-full border border-line bg-surface-2 px-2 py-1 text-xs font-medium text-fg-muted sm:flex"
      title={`${streak}-day streak`}
    >
      <Flame className="size-3.5 text-medium" />
      {streak}
    </span>
  );
}
