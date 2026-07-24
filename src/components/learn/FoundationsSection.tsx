"use client";

import Link from "next/link";
import { Compass, BookOpen, ChevronRight } from "lucide-react";
import { FOUNDATIONS } from "@/curriculum/foundations";
import { AlgorithmToy } from "./toys/AlgorithmToy";
import { focusRing } from "@/design-system/ui/interaction";
import { cn } from "@/lib/utils";

/**
 * Foundations on the spine — the pre-concept layer ABOVE the eight structures.
 * Anatomy mirrors LearnSection exactly (node on the line + title + count +
 * chevron; grid-rows reveal), but its rows are units, not problems, and its
 * count is a catalog fact: there is no read-tracking in useProgress yet, so it
 * honestly shows "4 chapters", never a fake "0 / 4". The spine's ink is
 * untouched — it measures problems, and these are not problems.
 */
export function FoundationsSection({
  isAnchor,
  open,
  onToggle,
  onSkipToArrays,
}: {
  /** The cold-start "you are here" — same luminance grammar as LearnSection's isFrontier. */
  isAnchor: boolean;
  open: boolean;
  onToggle: () => void;
  /** The escape hatch: collapse this section and hand focus to the Arrays header. Marks nothing. */
  onSkipToArrays: () => void;
}) {
  const panelId = "learn-section-foundations";

  return (
    <li className="relative">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className={cn(
          "grid min-h-11 w-full grid-cols-[24px_1fr_auto_auto] items-center gap-2 rounded-md py-1.5 pr-2 text-left",
          "transition-colors duration-[var(--duration-fast)] ease-out",
          // Selection is elevation + weight, never a tint.
          isAnchor ? "bg-surface-3" : "hover:bg-surface-2",
        )}
      >
        {/* Node, centred on the spine track (x = 12px). */}
        <span className="grid place-items-center" aria-hidden>
          <span
            className={cn(
              "size-4 rounded-full border-2 bg-base transition-colors duration-[var(--duration-base)] ease-out",
              isAnchor ? "border-fg" : "border-fg-faint", // ink ring = you are here
            )}
          />
        </span>

        <span className="flex min-w-0 items-center gap-2">
          <Compass className="size-4 shrink-0 text-fg-muted" />
          <span className={cn("truncate text-md", isAnchor ? "font-semibold text-fg" : "text-fg")}>
            Foundations
          </span>
        </span>

        <span className="text-sm text-fg-muted">
          <span className="font-mono tabular-nums text-fg">{FOUNDATIONS.length}</span> chapters
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
          <ul className="flex flex-col gap-0.5 pl-6 pt-1">
            {FOUNDATIONS.map((u) => (
              <li key={u.slug}>
                <Link
                  href={`/learn/foundations/${u.slug}`}
                  className={cn(
                    "grid min-h-11 grid-cols-[20px_1fr_auto] items-center gap-2 rounded-md px-2",
                    "transition-colors duration-[var(--duration-fast)] ease-out hover:bg-surface-2",
                  )}
                >
                  <span className="grid place-items-center" aria-hidden>
                    <BookOpen className="size-3.5 text-fg-muted" />
                  </span>
                  <span className="truncate text-base text-fg">{u.title}</span>
                  <span className="font-mono text-2xs text-fg-muted">≈ {u.minutes} min</span>
                </Link>
              </li>
            ))}
          </ul>

          {/* Touch the idea before you read about it — exactly ONE representation
              at a time, so the first unit's toy stands for the layer. */}
          <div className="pb-1 pl-6 pt-2">
            <AlgorithmToy />
          </div>

          {/* Expertise reversal: a plain exit that collapses the layer and hands
              focus to Arrays. It marks nothing — the counts stay honest. */}
          <div className="pb-2 pl-6">
            <button
              type="button"
              onClick={onSkipToArrays}
              className={cn(
                "inline-flex min-h-11 items-center rounded-md px-2 text-sm text-fg-muted",
                "transition-colors duration-[var(--duration-fast)] ease-out hover:text-fg",
                focusRing,
              )}
            >
              Know this already? Start at Arrays
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}
