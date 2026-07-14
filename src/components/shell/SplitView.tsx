"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * A resizable two-pane split with a draggable divider on wide screens; on narrow
 * screens (< lg) it collapses to a single pane with a tab switcher, so the canvas
 * never gets squeezed into an unusable sliver on phones.
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
}: {
  left: ReactNode;
  right: ReactNode;
  initial?: number;
  min?: number;
  max?: number;
  className?: string;
  leftLabel?: string;
  rightLabel?: string;
}) {
  const [ratio, setRatio] = useState(initial);
  const [narrow, setNarrow] = useState(false);
  const [tab, setTab] = useState<"left" | "right">("right");
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  // Track viewport width to switch between split and tabbed layouts.
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const sync = () => setNarrow(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const onMove = useCallback(
    (clientX: number) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const r = (clientX - rect.left) / rect.width;
      setRatio(Math.min(max, Math.max(min, r)));
    },
    [min, max],
  );

  useEffect(() => {
    const move = (e: PointerEvent) => dragging.current && onMove(e.clientX);
    const stop = () => {
      if (!dragging.current) return;
      dragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
    };
  }, [onMove]);

  if (narrow) {
    return (
      <div className={cn("flex w-full flex-col overflow-hidden", className)}>
        <div className="flex shrink-0 gap-1 border-b border-line bg-surface px-3 py-2">
          {(["left", "right"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors",
                tab === t ? "bg-brand-soft text-brand-strong" : "text-fg-muted hover:bg-surface-2 hover:text-fg",
              )}
            >
              {t === "left" ? leftLabel : rightLabel}
            </button>
          ))}
        </div>
        <div className="min-h-0 flex-1 overflow-auto">{tab === "left" ? left : right}</div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn("flex w-full overflow-hidden", className)}>
      <div className="min-w-0 overflow-auto" style={{ width: `${ratio * 100}%` }}>
        {left}
      </div>
      <div
        role="separator"
        aria-orientation="vertical"
        onPointerDown={() => {
          dragging.current = true;
          document.body.style.cursor = "col-resize";
          document.body.style.userSelect = "none";
        }}
        className="group relative w-px shrink-0 cursor-col-resize bg-line"
      >
        <div className="absolute inset-y-0 -left-2 -right-2 z-10" />
        <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-line transition-colors group-hover:bg-brand" />
      </div>
      <div className="min-w-0 flex-1 overflow-auto">{right}</div>
    </div>
  );
}
