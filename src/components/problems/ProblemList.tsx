"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Circle, CheckCircle2 } from "lucide-react";
import { DifficultyTag } from "@/design-system/ui/Badge";
import type { Problem } from "@/curriculum/catalog";
import { useProgress } from "@/engagement/useProgress";
import { useMounted } from "@/lib/useMounted";
import { cn } from "@/lib/utils";

export function ProblemList({ problems }: { problems: Problem[] }) {
  const [q, setQ] = useState("");
  const [topic, setTopic] = useState<string | null>(null);
  const topics = useMemo(() => Array.from(new Set(problems.map((p) => p.topic))), [problems]);
  const solved = useProgress((s) => s.solved);
  const mounted = useMounted();
  const solvedCount = mounted ? problems.filter((p) => solved.includes(p.slug)).length : 0;

  const filtered = problems.filter((p) => {
    const matchTopic = !topic || p.topic === topic;
    const needle = q.trim().toLowerCase();
    const matchText = !needle || p.title.toLowerCase().includes(needle) || p.topic.toLowerCase().includes(needle);
    return matchTopic && matchText;
  });

  return (
    <>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-fg-faint" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search problems…"
          className="h-11 w-full rounded-xl border border-line bg-surface pr-4 pl-10 text-sm text-fg placeholder:text-fg-faint focus:border-brand focus:outline-none"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Chip active={topic === null} onClick={() => setTopic(null)}>All</Chip>
        {topics.map((t) => (
          <Chip key={t} active={topic === t} onClick={() => setTopic(t)}>
            {t}
          </Chip>
        ))}
      </div>

      <div className="mt-5 mb-3 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
          <div
            className="h-full rounded-full bg-easy transition-all duration-500"
            style={{ width: `${problems.length ? (solvedCount / problems.length) * 100 : 0}%` }}
          />
        </div>
        <span className="shrink-0 font-mono text-xs text-fg-muted">
          {solvedCount} / {problems.length} solved
        </span>
      </div>
      <div className="overflow-hidden rounded-2xl border border-line">
        <div className="flex items-center gap-4 border-b border-line bg-surface-2 px-4 py-2.5 text-xs font-medium text-fg-faint">
          <span className="w-5" />
          <span className="flex-1">Problem</span>
          <span className="hidden w-40 sm:block">Topic</span>
          <span className="w-20 text-right">Difficulty</span>
        </div>
        {filtered.map((p) => (
          <Link
            key={p.slug}
            href={`/problem/${p.slug}`}
            className="flex items-center gap-4 border-b border-line bg-surface px-4 py-3 transition-colors last:border-0 hover:bg-surface-2"
          >
            {mounted && solved.includes(p.slug) ? (
              <CheckCircle2 className="size-4 shrink-0 text-easy" />
            ) : (
              <Circle className="size-4 shrink-0 text-fg-faint/50" />
            )}
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-fg">{p.title}</span>
            <span className="hidden w-40 truncate text-sm text-fg-muted sm:block">{p.topic}</span>
            <span className="flex w-20 justify-end">
              <DifficultyTag level={p.difficulty} />
            </span>
          </Link>
        ))}
        {filtered.length === 0 && (
          <div className="bg-surface px-4 py-12 text-center text-sm text-fg-muted">
            No problems match “{q}”.
          </div>
        )}
      </div>
    </>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-brand bg-brand-soft text-brand-strong"
          : "border-line bg-surface text-fg-muted hover:border-line-strong hover:text-fg",
      )}
    >
      {children}
    </button>
  );
}
