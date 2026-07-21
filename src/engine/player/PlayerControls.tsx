"use client";

import { useRef } from "react";
import { RotateCcw, SkipBack, SkipForward, Play, Pause } from "lucide-react";
import { usePlayer } from "./store";

const SPEEDS = [0.5, 1, 1.5, 2, 3];

export function PlayerControls() {
  const index = usePlayer((s) => s.index);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const speed = usePlayer((s) => s.speed);
  const total = usePlayer((s) => s.trace?.steps.length ?? 0);

  const last = Math.max(total - 1, 0);
  const pct = last > 0 ? (index / last) * 100 : 0;

  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const seekAt = (clientX: number) => {
    const el = trackRef.current;
    if (!el || last === 0) return;
    const r = el.getBoundingClientRect();
    const ratio = (clientX - r.left) / r.width;
    usePlayer.getState().seek(Math.round(Math.min(1, Math.max(0, ratio)) * last));
  };

  const cycleSpeed = () => {
    const i = SPEEDS.indexOf(speed);
    usePlayer.getState().setSpeed(SPEEDS[(i + 1) % SPEEDS.length] ?? 1);
  };

  return (
    <div className="flex items-center gap-3 border-t border-line bg-surface px-4 py-3">
      <div className="flex items-center gap-1 text-fg-muted">
        <button
          onClick={() => usePlayer.getState().reset()}
          className="grid size-8 place-items-center rounded-lg transition-colors hover:bg-surface-2 hover:text-fg"
          title="Reset (R)"
          aria-label="Reset"
        >
          <RotateCcw className="size-4" />
        </button>
        <button
          onClick={() => usePlayer.getState().prev()}
          disabled={index === 0}
          className="grid size-8 place-items-center rounded-lg transition-colors hover:bg-surface-2 hover:text-fg disabled:opacity-40 disabled:pointer-events-none"
          title="Step back (←)"
          aria-label="Step back"
        >
          <SkipBack className="size-4" />
        </button>
        <button
          onClick={() => usePlayer.getState().toggle()}
          className="mx-0.5 grid size-9 place-items-center rounded-full bg-accent text-accent-fg shadow-[var(--lift-hi)] transition-transform hover:scale-105 active:scale-95"
          title="Play / pause (Space)"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause className="size-4 fill-current" /> : <Play className="size-4 translate-x-px fill-current" />}
        </button>
        <button
          onClick={() => usePlayer.getState().stepForward()}
          disabled={index >= last}
          className="grid size-8 place-items-center rounded-lg transition-colors hover:bg-surface-2 hover:text-fg disabled:opacity-40 disabled:pointer-events-none"
          title="Step forward (→)"
          aria-label="Step forward"
        >
          <SkipForward className="size-4" />
        </button>
      </div>

      <button
        onClick={cycleSpeed}
        className="rounded-md border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-2xs text-fg-muted transition-colors hover:border-line-strong hover:text-fg"
        title="Speed (+ / −)"
      >
        {speed}×
      </button>

      <div
        ref={trackRef}
        onPointerDown={(e) => {
          dragging.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          seekAt(e.clientX);
        }}
        onPointerMove={(e) => dragging.current && seekAt(e.clientX)}
        onPointerUp={(e) => {
          dragging.current = false;
          e.currentTarget.releasePointerCapture(e.pointerId);
        }}
        className="group relative mx-1 flex h-4 flex-1 cursor-pointer items-center"
        role="slider"
        aria-label="Timeline"
        aria-valuemin={0}
        aria-valuemax={last}
        aria-valuenow={index}
      >
        <div className="relative h-1 w-full overflow-hidden rounded-full bg-surface-3">
          <div className="absolute inset-y-0 left-0 rounded-full bg-accent" style={{ width: `${pct}%` }} />
        </div>
        <div
          className="absolute size-3 -translate-x-1/2 rounded-full bg-accent opacity-0 shadow-[var(--lift)] transition-opacity group-hover:opacity-100"
          style={{ left: `${pct}%` }}
        />
      </div>

      <span className="shrink-0 font-mono text-2xs tabular-nums text-fg-muted">
        Step {total === 0 ? 0 : index + 1} / {total}
      </span>
    </div>
  );
}
