"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { focusRing, pressFeedback } from "@/design-system/ui/interaction";
import { cn } from "@/lib/utils";

/**
 * A resizable two-pane split with a draggable divider on wide screens; below `lg`
 * it collapses to a single pane with a switcher, so the canvas never gets squeezed
 * into an unusable sliver on phones.
 *
 * The narrow/wide decision is made ENTIRELY IN CSS. An earlier version held it in
 * React state seeded to `false` and corrected it from a `matchMedia` effect, which
 * meant every mobile visit painted the desktop split first and then snapped to the
 * tabbed layout one frame later — a guaranteed layout shift on the exact devices
 * least able to absorb one. There is no viewport state here now: the container is
 * `flex-col lg:flex-row`, the switcher is `lg:hidden`, and the drag ratio reaches
 * the panes through a custom property that only the `lg:` width utility reads. The
 * first paint is correct at any width, including during SSR.
 *
 * Both panes stay MOUNTED at all times — the inactive one is `hidden`, not
 * unmounted — so switching tabs on mobile preserves scroll position, canvas state,
 * and player state instead of tearing the pane down and rebuilding it.
 */
export function SplitView({
  left,
  right,
  initial = 0.42,
  min = 0.3,
  max = 0.62,
  className,
  leftLabel = "Left",
  rightLabel = "Right",
  scrollPanes = true,
}: {
  left: ReactNode;
  right: ReactNode;
  initial?: number;
  min?: number;
  max?: number;
  className?: string;
  leftLabel?: string;
  rightLabel?: string;
  /**
   * Whether SplitView scrolls its panes. Default `true` suits plain content that
   * just needs to overflow.
   *
   * Pass `false` when the pane content manages its own scrolling — a full-height
   * column with a pinned footer, say. That is what keeps the transport bar
   * reachable on mobile: with a scrolling pane wrapper the whole column, transport
   * included, scrolls away as one block. With `scrollPanes={false}` the wrapper is
   * a fixed-height clip, the content's own inner region scrolls, and anything
   * pinned to the bottom of the column stays pinned.
   */
  scrollPanes?: boolean;
}) {
  const [ratio, setRatio] = useState(initial);
  const [tab, setTab] = useState<"left" | "right">("right");
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const onMove = useCallback(
    (clientX: number) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0) return;
      const r = (clientX - rect.left) / rect.width;
      setRatio(Math.min(max, Math.max(min, r)));
    },
    [min, max],
  );

  const stopDrag = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  useEffect(() => {
    const move = (e: PointerEvent) => dragging.current && onMove(e.clientX);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stopDrag);
    window.addEventListener("pointercancel", stopDrag);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stopDrag);
      window.removeEventListener("pointercancel", stopDrag);
      stopDrag();
    };
  }, [onMove, stopDrag]);

  // Keyboard resize: the divider is focusable, so the split is not mouse-only.
  const nudge = (delta: number) => setRatio((r) => Math.min(max, Math.max(min, r + delta)));

  const paneBase = cn(
    "min-h-0 min-w-0",
    scrollPanes ? "overflow-auto" : "overflow-hidden",
  );

  return (
    <div
      ref={containerRef}
      className={cn("flex min-h-0 w-full flex-col overflow-hidden lg:flex-row", className)}
      style={{ "--split-w": `${ratio * 100}%` } as CSSProperties}
    >
      {/* Pane switcher — narrow viewports only. Not tabs in the ARIA sense: above
          `lg` there is no switching to do and both panes are visible at once, so
          a tablist role would be describing a widget that isn't there. */}
      <div
        className="flex shrink-0 gap-1 border-b border-line bg-surface px-3 py-2 lg:hidden"
        role="group"
        aria-label="Choose pane"
      >
        {(["left", "right"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            aria-pressed={tab === t}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-sm font-medium",
              pressFeedback,
              focusRing,
              tab === t
                ? "bg-surface-3 text-fg"
                : "text-fg-muted hover:bg-surface-2 hover:text-fg active:bg-surface-3",
            )}
          >
            {t === "left" ? leftLabel : rightLabel}
          </button>
        ))}
      </div>

      <div
        className={cn(
          paneBase,
          // Narrow: fills the column when selected, removed when not.
          tab === "left" ? "flex-1" : "hidden",
          // Wide: always shown, sized by the drag ratio.
          "lg:block lg:flex-none lg:w-[var(--split-w)]",
        )}
      >
        {left}
      </div>

      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize panes"
        aria-valuenow={Math.round(ratio * 100)}
        aria-valuemin={Math.round(min * 100)}
        aria-valuemax={Math.round(max * 100)}
        tabIndex={0}
        onPointerDown={() => {
          dragging.current = true;
          document.body.style.cursor = "col-resize";
          document.body.style.userSelect = "none";
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") nudge(-0.02);
          else if (e.key === "ArrowRight") nudge(0.02);
          else if (e.key === "Home") setRatio(min);
          else if (e.key === "End") setRatio(max);
          else return;
          e.preventDefault();
        }}
        onDoubleClick={() => setRatio(initial)}
        className={cn(
          "group relative hidden w-px shrink-0 cursor-col-resize bg-line lg:block",
          focusRing,
        )}
      >
        {/* Widened hit area — the visual rule stays 1px. */}
        <div className="absolute inset-y-0 -left-2 -right-2 z-10" />
        <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-line transition-colors duration-[var(--duration-fast)] ease-out group-hover:bg-line-strong group-focus-visible:bg-line-strong group-active:bg-line-strong" />
      </div>

      <div
        className={cn(
          paneBase,
          tab === "right" ? "flex-1" : "hidden",
          "lg:block lg:flex-1",
        )}
      >
        {right}
      </div>
    </div>
  );
}
