"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import {
  Hash,
  Link2,
  Layers,
  ArrowRightLeft,
  Repeat,
  GitBranch,
  Waypoints,
  Rows3,
  Check,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import type { Problem } from "@/curriculum/catalog";
import type { StructureSlug } from "@/curriculum/structures";
import type { LessonMeta } from "@/curriculum/lesson-catalog";
import { StructureToy } from "./toys/StructureToy";
import { cn } from "@/lib/utils";

type IconType = ComponentType<{ className?: string }>;

/** The eight structure marks — identity is the icon (and the label), never a hue. */
const STRUCT_ICON: Record<StructureSlug, IconType> = {
  arrays: Rows3,
  "hash-tables": Hash,
  "linked-lists": Link2,
  stacks: Layers,
  queues: ArrowRightLeft,
  recursion: Repeat,
  trees: GitBranch,
  graphs: Waypoints,
};

/**
 * One structure on the spine: a collapsed header row (a node on the line + title +
 * done/total + chevron) that opens to reveal its optional chapter and its problems.
 * Everything is achromatic — progress is carried by luminance (a filled bright node
 * = done, a hollow dim ring = not) and by weight, never by colour.
 */
export function LearnSection({
  slug,
  title,
  problems,
  done,
  total,
  isFrontier,
  frontierSlug,
  solvedSet,
  open,
  onToggle,
  lessonMeta,
  mounted,
}: {
  slug: StructureSlug;
  title: string;
  problems: Problem[];
  done: number;
  total: number;
  /** This section holds the learner's current step — the one "you are here". */
  isFrontier: boolean;
  /** Slug of the single frontier problem, for the forward marker. */
  frontierSlug: string | null;
  solvedSet: Set<string>;
  open: boolean;
  onToggle: () => void;
  lessonMeta: LessonMeta | undefined;
  mounted: boolean;
}) {
  const Icon = STRUCT_ICON[slug];
  const complete = mounted && total > 0 && done === total;
  const panelId = `learn-section-${slug}`;

  return (
    <li className="relative">
      {/* A toggle, never a navigation — most /learn/<slug> routes 404, so links
          only ever point at real routes (the chapter and the problems). */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className={cn(
          "grid min-h-11 w-full grid-cols-[24px_1fr_auto_auto] items-center gap-2 rounded-md py-1.5 pr-2 text-left",
          "transition-colors duration-[var(--duration-fast)] ease-out",
          // Selection is elevation + weight (below), never a tint.
          isFrontier ? "bg-surface-3" : "hover:bg-surface-2",
        )}
      >
        {/* Node, centred on the spine track (x = 12px). */}
        <span className="grid place-items-center" aria-hidden>
          <span
            className={cn(
              "size-4 rounded-full transition-colors duration-[var(--duration-base)] ease-out",
              complete
                ? // Filled + a --bg halo so it reads as a node on the line, not a bulge.
                  "bg-fg ring-2 ring-base"
                : isFrontier
                  ? "border-2 border-fg bg-base" // ink ring = you are here
                  : "border-2 border-fg-faint bg-base", // dim hollow (still ≥3:1)
            )}
          />
        </span>

        <span className="flex min-w-0 items-center gap-2">
          <Icon className="size-4 shrink-0 text-fg-muted" />
          <span className={cn("truncate text-md", isFrontier ? "font-semibold text-fg" : "text-fg")}>{title}</span>
        </span>

        <span className="font-mono text-sm tabular-nums">
          {mounted ? (
            <>
              <span className="text-fg">{done}</span>
              <span className="text-fg-muted"> / {total}</span>
            </>
          ) : (
            // Pre-mount: catalog fact only, never a false "0 / n".
            <span className="text-fg-muted">{total}</span>
          )}
        </span>

        <ChevronRight
          className={cn(
            "size-4 text-fg-muted transition-transform duration-[var(--duration-base)] ease-out",
            open && "rotate-90",
          )}
          aria-hidden
        />
      </button>

      {/* Reveal via grid-rows so the content is always in the DOM (a11y + reduced
          motion never hides it behind a transition that won't fire). */}
      <div
        id={panelId}
        className="grid transition-[grid-template-rows] duration-[var(--duration-base)] ease-in-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          {/* Touch the structure before you open a problem about it. */}
          <StructureToy slug={slug} />
          <ul className="flex flex-col gap-0.5 pb-2 pl-6">
            {lessonMeta && (
              <li>
                <Link
                  href={`/learn/${slug}`}
                  className="inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-sm text-fg-muted transition-colors duration-[var(--duration-fast)] ease-out hover:text-fg"
                >
                  <BookOpen className="size-3.5 shrink-0 text-fg-muted" aria-hidden />
                  Read the chapter:&nbsp;<span className="font-medium text-fg">{lessonMeta.title}</span>
                </Link>
              </li>
            )}
            {problems.map((p) => {
              const psolved = solvedSet.has(p.slug);
              const isNext = mounted && frontierSlug === p.slug;
              return (
                <li key={p.slug}>
                  <Link
                    href={`/problem/${p.slug}`}
                    aria-current={isNext ? "step" : undefined}
                    className={cn(
                      "grid min-h-11 grid-cols-[20px_1fr_auto] items-center gap-2 rounded-md px-2",
                      "transition-colors duration-[var(--duration-fast)] ease-out",
                      isNext ? "bg-surface-3" : "hover:bg-surface-2",
                    )}
                  >
                    <span className="grid place-items-center" aria-hidden>
                      {psolved ? (
                        <Check className="size-4 text-fg" />
                      ) : (
                        <span
                          className={cn(
                            "size-2 rounded-full border bg-base",
                            isNext ? "border-fg" : "border-fg-faint",
                          )}
                        />
                      )}
                    </span>
                    <span className="flex min-w-0 items-center gap-2">
                      <span className={cn("truncate text-base", psolved ? "text-fg" : "text-fg-muted")}>
                        {p.title}
                      </span>
                      {isNext && (
                        <span className="shrink-0 rounded-sm bg-surface px-1.5 py-0.5 text-2xs font-medium text-fg-muted">
                          Next
                        </span>
                      )}
                    </span>
                    <span className="hidden font-mono text-xs text-fg-muted sm:block">{p.difficulty}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </li>
  );
}
