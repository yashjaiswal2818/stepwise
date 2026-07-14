"use client";

import Link from "next/link";
import { ArrowRight, Check, Flame } from "lucide-react";
import { TIERS, PROBLEMS } from "@/curriculum/catalog";
import { useProgress } from "@/engagement/useProgress";
import { useMounted } from "@/lib/useMounted";
import { BADGES } from "@/engagement/badges";
import { cn } from "@/lib/utils";

const diffDot = { Easy: "bg-easy", Medium: "bg-medium", Hard: "bg-hard" } as const;

export function LearnPath() {
  const solved = useProgress((s) => s.solved);
  const streak = useProgress((s) => s.streak);
  const mounted = useMounted();

  const isSolved = (slug: string) => mounted && solved.includes(slug);
  const solvedCount = mounted ? PROBLEMS.filter((p) => solved.includes(p.slug)).length : 0;
  const ctx = { solved: mounted ? solved.length : 0, streak: mounted ? streak : 0 };

  return (
    <div className="mx-auto max-w-3xl px-5 py-14">
      <header className="text-center">
        <p className="text-sm font-semibold text-brand-strong">The learning path</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
          Start at the foundations, build up
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-fg-muted">
          A beginner-first order — linear structures before non-linear, fundamentals before
          paradigms. Solve a problem by stepping it through to the end.
        </p>
      </header>

      <div className="mt-8 rounded-2xl border border-line bg-surface p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-2xl font-semibold text-fg">
              {solvedCount}
              <span className="text-fg-faint">/{PROBLEMS.length}</span>
            </div>
            <div className="text-xs text-fg-muted">problems solved</div>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-line bg-surface-2 px-3 py-1.5">
            <Flame className={cn("size-4", ctx.streak > 0 ? "text-medium" : "text-fg-faint")} />
            <span className="text-sm font-semibold text-fg">{ctx.streak}</span>
            <span className="text-xs text-fg-muted">day streak</span>
          </div>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-3">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand to-cyan transition-all duration-500"
            style={{ width: `${PROBLEMS.length ? (solvedCount / PROBLEMS.length) * 100 : 0}%` }}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {BADGES.map((b) => {
            const earned = b.earned(ctx);
            return (
              <div
                key={b.id}
                title={b.desc}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
                  earned ? "border-brand/40 bg-brand-soft text-brand-strong" : "border-line bg-surface-2 text-fg-faint",
                )}
              >
                {earned && <Check className="size-3" />}
                {b.label}
              </div>
            );
          })}
        </div>
      </div>

      <div className="relative mt-10">
        <div className="absolute top-2 bottom-2 left-[26px] w-px bg-line" aria-hidden />
        <div className="space-y-5">
          {TIERS.map((tier) => {
            const items = PROBLEMS.filter((p) => p.tier === tier.n);
            const done = items.filter((p) => isSolved(p.slug)).length;
            return (
              <div key={tier.n} className="relative pl-16">
                <div
                  className={cn(
                    "absolute left-0 grid size-[52px] place-items-center rounded-2xl border text-lg font-semibold shadow-[var(--shadow-sm)]",
                    done === items.length && items.length > 0
                      ? "border-easy/40 bg-easy/10 text-easy"
                      : "border-line bg-surface text-brand-strong",
                  )}
                >
                  {done === items.length && items.length > 0 ? <Check className="size-6" /> : tier.n}
                </div>
                <div className="rounded-2xl border border-line bg-surface p-5">
                  <div className="flex items-baseline justify-between gap-3">
                    <h2 className="text-lg font-semibold text-fg">{tier.name}</h2>
                    <span className="shrink-0 font-mono text-xs text-fg-faint">
                      {done} / {items.length}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-fg-muted">{tier.blurb}</p>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {items.map((p) => {
                      const s = isSolved(p.slug);
                      return (
                        <Link
                          key={p.slug}
                          href={`/problem/${p.slug}`}
                          className="group flex items-center gap-2.5 rounded-lg border border-line bg-elevated px-3 py-2 transition-colors hover:border-line-strong hover:bg-surface-2"
                        >
                          <span className={`size-2 shrink-0 rounded-full ${diffDot[p.difficulty]}`} />
                          <span className="min-w-0 flex-1 truncate text-sm text-fg">{p.title}</span>
                          {s ? (
                            <Check className="size-4 shrink-0 text-easy" />
                          ) : (
                            <ArrowRight className="size-3.5 shrink-0 text-fg-faint opacity-0 transition-opacity group-hover:opacity-100" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
