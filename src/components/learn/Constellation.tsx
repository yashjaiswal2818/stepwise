"use client";

import { useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type CSSProperties, type MutableRefObject } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Hash,
  Link2,
  Layers,
  ArrowRightLeft,
  Repeat,
  GitBranch,
  Waypoints,
  Rows3,
  Flame,
  Check,
  Plus,
  Minus,
  Locate,
} from "lucide-react";
import { NODES, EDGES, NODE_BY_ID, NEIGHBORS, STRUCTURE_CHILDREN, VIEW, type CNode } from "@/curriculum/constellation";
import { PROBLEMS } from "@/curriculum/catalog";
import { useProgress } from "@/engagement/useProgress";
import { useMounted } from "@/lib/useMounted";
import { cn } from "@/lib/utils";

type IconType = React.ComponentType<{ className?: string; style?: CSSProperties }>;

const STRUCT_ICON: Record<string, IconType> = {
  arrays: Rows3,
  "hash-tables": Hash,
  "linked-lists": Link2,
  stacks: Layers,
  queues: ArrowRightLeft,
  recursion: Repeat,
  trees: GitBranch,
  graphs: Waypoints,
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function Constellation() {
  const solved = useProgress((s) => s.solved);
  const streak = useProgress((s) => s.streak);
  const mounted = useMounted();

  const isSolved = (id: string) => {
    if (!mounted) return false;
    const node = NODE_BY_ID[id];
    if (node?.kind === "structure") return (STRUCTURE_CHILDREN[id] ?? []).some((c) => solved.includes(c));
    return solved.includes(id);
  };
  const exploredCount = mounted ? PROBLEMS.filter((p) => solved.includes(p.slug)).length : 0;

  const [hovered, setHovered] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [fit, setFit] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const viewportRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ ox: number; oy: number; px: number; py: number } | null>(null);
  const moved = useRef(false);

  // Fit the authored world into the viewport, and refit on resize.
  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const compute = () => {
      const { width, height } = el.getBoundingClientRect();
      if (!width || !height) return;
      const s = clamp(Math.min(width / VIEW.w, height / VIEW.h) * 0.98, 0.35, 1.3);
      setFit(s);
      setScale((prev) => (Math.abs(prev - 1) < 0.001 ? s : prev)); // only snap on first measure
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    drag.current = { ox: e.clientX, oy: e.clientY, px: pan.x, py: pan.y };
    moved.current = false;
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.ox;
    const dy = e.clientY - drag.current.oy;
    if (Math.abs(dx) + Math.abs(dy) > 3) moved.current = true;
    setPan({ x: clamp(drag.current.px + dx, -420, 420), y: clamp(drag.current.py + dy, -320, 320) });
  };
  const endDrag = () => {
    drag.current = null;
  };

  const zoom = (dir: number) => setScale((s) => clamp(+(s + dir * 0.15).toFixed(2), 0.4, 1.7));
  const recenter = () => {
    setScale(fit);
    setPan({ x: 0, y: 0 });
  };

  const active = hovered ? new Set<string>([hovered, ...NEIGHBORS[hovered]]) : null;

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line px-5 py-4 sm:px-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg text-balance sm:text-[28px]">Start anywhere.</h1>
          <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-fg-muted sm:text-sm">
            Not a syllabus — a map. Every structure and problem, wired by what builds on what. Follow a thread that
            pulls you in.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm">
            <span className="font-semibold text-fg">{exploredCount}</span>
            <span className="text-fg-faint">/{PROBLEMS.length} explored</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5">
            <Flame className={cn("size-4", mounted && streak > 0 ? "text-medium" : "text-fg-faint")} />
            <span className="text-sm font-semibold text-fg">{mounted ? streak : 0}</span>
          </div>
        </div>
      </div>

      <div
        ref={viewportRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className="bg-grid relative min-h-0 flex-1 cursor-grab touch-none overflow-hidden bg-base active:cursor-grabbing"
      >
        {/* Soft brand glow anchoring the center of the map */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[60%] w-[60%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-[120px]"
          style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--brand) 22%, transparent), transparent 70%)" }}
        />

        <div
          className="absolute left-1/2 top-1/2"
          style={{
            width: VIEW.w,
            height: VIEW.h,
            transform: `translate(-50%,-50%) translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: "center",
          }}
        >
          <svg
            viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
            width={VIEW.w}
            height={VIEW.h}
            className="absolute inset-0 overflow-visible"
            aria-hidden
          >
            {EDGES.map((e, i) => {
              const a = NODE_BY_ID[e.from];
              const b = NODE_BY_ID[e.to];
              if (!a || !b) return null;
              const on = active ? active.has(e.from) && active.has(e.to) : false;
              const dim = !!active && !on;
              const builds = e.kind === "builds";
              const color = builds ? "var(--brand)" : b.accent;
              // The "builds on" backbone glows a faint brand purple by default so the
              // web of relationships reads at a glance; "has" edges stay quieter.
              const restOpacity = builds ? 0.5 : 0.32;
              return (
                <motion.line
                  key={i}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={on ? color : builds ? "var(--brand)" : "var(--border-strong)"}
                  strokeWidth={builds ? 2 : 1.25}
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: dim ? 0.1 : on ? 0.95 : restOpacity }}
                  transition={{
                    pathLength: { duration: 0.75, delay: 0.15 + i * 0.012, ease: [0.22, 1, 0.36, 1] },
                    opacity: { duration: 0.3 },
                  }}
                />
              );
            })}
          </svg>

          {NODES.map((n, i) => (
            <NodeDot
              key={n.id}
              n={n}
              i={i}
              solved={isSolved(n.id)}
              dim={active ? !active.has(n.id) : false}
              hot={hovered === n.id}
              moved={moved}
              onEnter={() => setHovered(n.id)}
              onLeave={() => setHovered(null)}
            />
          ))}
        </div>

        <div className="absolute bottom-4 right-4 flex flex-col gap-1.5">
          <ZoomBtn onClick={() => zoom(1)} label="Zoom in">
            <Plus className="size-4" />
          </ZoomBtn>
          <ZoomBtn onClick={() => zoom(-1)} label="Zoom out">
            <Minus className="size-4" />
          </ZoomBtn>
          <ZoomBtn onClick={recenter} label="Recenter">
            <Locate className="size-4" />
          </ZoomBtn>
        </div>

        <div className="pointer-events-none absolute bottom-4 left-4 hidden rounded-full border border-line bg-surface/80 px-3 py-1.5 text-[12px] text-fg-faint backdrop-blur sm:block">
          Drag to pan · ± to zoom · click a node to dive in
        </div>
      </div>
    </div>
  );
}

function NodeDot({
  n,
  i,
  solved,
  dim,
  hot,
  moved,
  onEnter,
  onLeave,
}: {
  n: CNode;
  i: number;
  solved: boolean;
  dim: boolean;
  hot: boolean;
  moved: MutableRefObject<boolean>;
  onEnter: () => void;
  onLeave: () => void;
}) {
  const isStruct = n.kind === "structure";
  const size = isStruct ? 82 : 52;
  const Icon = isStruct ? STRUCT_ICON[n.structure] : null;
  const lit = solved || hot;

  return (
    <motion.div
      className="absolute"
      style={{ left: n.x, top: n.y, transform: "translate(-50%,-50%)", zIndex: hot ? 20 : isStruct ? 10 : 5 }}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: dim ? 0.3 : 1, scale: 1 }}
      transition={{
        opacity: { duration: 0.3 },
        scale: { type: "spring", stiffness: 360, damping: 22, delay: 0.1 + i * 0.02 },
      }}
    >
      <Link
        href={n.href}
        aria-label={`${n.label} — ${isStruct ? "structure" : "problem"}${solved ? ", explored" : ""}`}
        onClick={(e) => {
          if (moved.current) e.preventDefault();
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          moved.current = false;
        }}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        onFocus={onEnter}
        onBlur={onLeave}
        className="group grid place-items-center rounded-full outline-none"
        style={{ "--accent": n.accent } as CSSProperties}
      >
        <span
          className={cn(
            "relative grid place-items-center rounded-full border transition-[transform,box-shadow,border-color] duration-200",
            isStruct ? "bg-surface" : "bg-elevated",
            hot ? "scale-110" : "scale-100",
          )}
          style={{
            width: size,
            height: size,
            borderColor: lit ? "var(--accent)" : "var(--border-strong)",
            boxShadow: lit
              ? "0 0 0 1px color-mix(in oklab, var(--accent) 55%, transparent), 0 10px 30px -8px color-mix(in oklab, var(--accent) 55%, transparent)"
              : "var(--shadow-sm)",
          }}
        >
          {isStruct && Icon ? (
            <Icon className="size-6" style={{ color: "var(--accent)" }} />
          ) : (
            <span className="size-2.5 rounded-full" style={{ background: "var(--accent)" }} />
          )}
          {solved && (
            <span className="absolute -right-0.5 -top-0.5 grid size-[18px] place-items-center rounded-full bg-base ring-2 ring-base">
              <Check className="size-3" style={{ color: "var(--accent)" }} />
            </span>
          )}
        </span>
        <span
          className={cn(
            "pointer-events-none absolute left-1/2 top-full mt-1.5 -translate-x-1/2 whitespace-nowrap text-center font-medium transition-colors",
            isStruct ? "text-[13px] text-fg" : "text-[11px] text-fg-muted group-hover:text-fg",
          )}
        >
          {n.label}
        </span>
      </Link>
    </motion.div>
  );
}

function ZoomBtn({ children, onClick, label }: { children: React.ReactNode; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="grid size-9 place-items-center rounded-lg border border-line bg-surface/90 text-fg-muted backdrop-blur transition-colors hover:border-line-strong hover:text-fg"
    >
      {children}
    </button>
  );
}
