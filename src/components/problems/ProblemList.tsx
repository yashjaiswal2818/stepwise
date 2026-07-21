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

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return problems.filter((p) => {
      const matchTopic = !topic || p.topic === topic;
      const matchText =
        !needle || p.title.toLowerCase().includes(needle) || p.topic.toLowerCase().includes(needle);
      return matchTopic && matchText;
    });
  }, [problems, q, topic]);

  const pct = problems.length ? (solvedCount / problems.length) * 100 : 0;
  const needle = q.trim();
  const filtering = needle.length > 0 || topic !== null;
  const clearFilters = () => {
    setQ("");
    setTopic(null);
  };

  // Name what actually came up empty, so the reader knows which control to undo.
  const emptyMessage = needle
    ? topic
      ? `Nothing in “${topic}” matches “${needle}”.`
      : `Nothing matches “${needle}”.`
    : topic
      ? `Nothing is filed under “${topic}”.`
      : "No problems yet.";

  return (
    <>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-fg-faint" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search problems by title or topic"
          placeholder="Search problems…"
          className={cn(
            "h-11 w-full rounded-md border border-line bg-surface pr-4 pl-10 text-base text-fg",
            "placeholder:text-fg-faint",
            "transition-colors duration-[var(--duration-fast)]",
            "hover:border-line-strong",
            // The global :focus-visible ring in globals.css is the focus
            // indicator. Do not add outline-none here — this input shipped with
            // it, and a stripped ring is the defect, not the style.
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-line",
          )}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter by topic">
        <Chip active={topic === null} onClick={() => setTopic(null)}>
          All
        </Chip>
        {topics.map((t) => (
          <Chip key={t} active={topic === t} onClick={() => setTopic(t)}>
            {t}
          </Chip>
        ))}
      </div>

      <div className="mt-5 mb-3 flex items-center gap-3">
        <div
          className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3"
          role="progressbar"
          aria-label="Problems solved"
          aria-valuemin={0}
          aria-valuemax={problems.length}
          aria-valuenow={solvedCount}
          aria-valuetext={`${solvedCount} of ${problems.length} solved`}
        >
          {/* Progress is not an algorithm state, so it is not saturated —
              --accent is the high-contrast emphasis token. */}
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-[var(--duration-slow)] ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="shrink-0 font-mono text-xs text-fg-muted">
          {solvedCount} / {problems.length} solved
        </span>
      </div>

      <div className="overflow-hidden rounded-lg border border-line">
        <div className="flex items-center gap-4 border-b border-line bg-surface-2 px-4 py-2.5 text-xs font-medium text-fg-faint">
          <span className="w-5" />
          <span className="flex-1">Problem</span>
          <span className="hidden w-40 sm:block">Topic</span>
          <span className="w-20 text-right">Difficulty</span>
        </div>

        {filtered.map((p) => {
          const isSolved = mounted && solved.includes(p.slug);
          return (
            <Link
              key={p.slug}
              href={`/problem/${p.slug}`}
              className={cn(
                "flex items-center gap-4 border-b border-line bg-surface px-4 py-3 last:border-0",
                "transition-colors duration-[var(--duration-fast)]",
                "hover:bg-surface-2 active:bg-surface-3",
              )}
            >
              {isSolved ? (
                <CheckCircle2 className="size-4 shrink-0 text-fg" aria-hidden />
              ) : (
                <Circle className="size-4 shrink-0 text-fg-faint" aria-hidden />
              )}
              {/* Solved-ness is carried by icon shape AND contrast, never by hue
                  alone — and it is spelled out for screen readers. */}
              <span className="sr-only">{isSolved ? "Solved." : "Not solved."}</span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-fg">{p.title}</span>
              <span className="hidden w-40 truncate text-sm text-fg-muted sm:block">{p.topic}</span>
              <span className="flex w-20 justify-end">
                <DifficultyTag level={p.difficulty} />
              </span>
            </Link>
          );
        })}

        {filtered.length === 0 && (
          <div className="bg-surface px-4 py-12 text-center">
            <p className="text-sm text-fg">{emptyMessage}</p>
            {filtering && (
              <>
                <p className="mx-auto mt-1.5 max-w-sm text-sm text-fg-muted">
                  Search reads a problem’s title and its topic — try “tree”, “sort”, or a technique
                  like “two pointers”.
                </p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className={cn(
                    "mt-4 inline-flex h-8 items-center rounded-sm border border-line-strong px-3 text-sm font-medium text-fg",
                    "transition-colors duration-[var(--duration-fast)]",
                    "hover:bg-surface-2 active:bg-surface-3",
                  )}
                >
                  Clear filters
                </button>
              </>
            )}
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
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium",
        "transition-colors duration-[var(--duration-fast)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        // Selected is elevation + border weight, never a tinted fill.
        active
          ? "border-line-strong bg-surface-3 text-fg"
          : "border-line bg-surface text-fg-muted hover:border-line-strong hover:text-fg active:bg-surface-2",
      )}
    >
      {children}
    </button>
  );
}
