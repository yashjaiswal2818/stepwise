"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type CSSProperties,
  type MutableRefObject,
} from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
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
  Plus,
  Minus,
  Locate,
  ArrowLeft,
  BookOpen,
} from "lucide-react";
import { NODES, EDGES, NODE_BY_ID, NEIGHBORS, STRUCTURE_CHILDREN, VIEW, type CNode } from "@/curriculum/constellation";
import { STRUCTURES } from "@/curriculum/structures";
import { getLessonMeta } from "@/curriculum/lesson-catalog";
import { LearnLead } from "./LearnLead";
import { DUR, EASE_OUT } from "@/engine/canvas/motion";
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

const BLURB = Object.fromEntries(STRUCTURES.map((s) => [s.slug, s.blurb]));

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Zoom limits — also drive the disabled state on the zoom buttons. */
const ZOOM_MIN = 0.4;
const ZOOM_MAX = 1.9;

export function Constellation() {
  const solved = useProgress((s) => s.solved);
  const mounted = useMounted();
  // prefers-reduced-motion: the map's staggered draw-in and node pop are the
  // biggest motion on the surface. Under reduced motion they resolve instantly
  // (content still fully rendered — never gated on a transition that won't fire).
  const reduce = useReducedMotion();

  const isSolved = (id: string) => {
    if (!mounted) return false;
    const node = NODE_BY_ID[id];
    if (node?.kind === "structure") return (STRUCTURE_CHILDREN[id] ?? []).some((c) => solved.includes(c));
    return solved.includes(id);
  };

  /** How far through one structure hub the learner is — drives the hub's ring. */
  const hubProgress = (id: string) => {
    const children = STRUCTURE_CHILDREN[id] ?? [];
    return { done: mounted ? children.filter((c) => solved.includes(c)).length : 0, total: children.length };
  };

  const [hovered, setHovered] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [fit, setFit] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const sizeRef = useRef({ w: 0, h: 0 });
  const drag = useRef<{ ox: number; oy: number; px: number; py: number } | null>(null);
  const moved = useRef(false);

  // Fit the authored world into the viewport, and refit on resize.
  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const compute = () => {
      const { width, height } = el.getBoundingClientRect();
      if (!width || !height) return;
      sizeRef.current = { w: width, h: height };
      const s = clamp(Math.min(width / VIEW.w, height / VIEW.h) * 0.98, 0.35, 1.3);
      setFit(s);
      setScale((prev) => (Math.abs(prev - 1) < 0.001 ? s : prev)); // only snap on first measure
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const unfocus = () => {
    setFocused(null);
    setScale(fit);
    setPan({ x: 0, y: 0 });
  };

  // Frame a structure hub and its problem children; toggles off if already focused.
  const focusHub = (id: string) => {
    if (focused === id) return unfocus();
    const group = [NODE_BY_ID[id], ...(STRUCTURE_CHILDREN[id] ?? []).map((c) => NODE_BY_ID[c])].filter(Boolean);
    const xs = group.map((n) => n.x);
    const ys = group.map((n) => n.y);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    const pad = 150;
    const bw = Math.max(...xs) - Math.min(...xs) + pad * 2;
    const bh = Math.max(...ys) - Math.min(...ys) + pad * 2;
    const { w: vw, h: vh } = sizeRef.current;
    const s = vw && vh ? clamp(Math.min(vw / bw, vh / bh), Math.max(fit, 0.9), 1.8) : Math.max(fit, 1);
    setScale(s);
    setPan({ x: -s * (cx - VIEW.w / 2), y: -s * (cy - VIEW.h / 2) });
    setFocused(id);
  };

  // Optional deep link: /learn?focus=<structure-slug> opens that hub already focused.
  useEffect(() => {
    const f = new URLSearchParams(window.location.search).get("focus");
    if (f && NODE_BY_ID[f]?.kind === "structure") requestAnimationFrame(() => focusHub(f));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Esc exits focus.
  useEffect(() => {
    if (!focused) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") unfocus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focused, fit]);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    drag.current = { ox: e.clientX, oy: e.clientY, px: pan.x, py: pan.y };
    moved.current = false;
    setDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.ox;
    const dy = e.clientY - drag.current.oy;
    if (Math.abs(dx) + Math.abs(dy) > 3) moved.current = true;
    setPan({ x: clamp(drag.current.px + dx, -900, 900), y: clamp(drag.current.py + dy, -700, 700) });
  };
  const endDrag = () => {
    if (!moved.current && focused) unfocus(); // tap empty space to exit focus
    drag.current = null;
    setDragging(false);
  };

  const zoom = (dir: number) => setScale((s) => clamp(+(s + dir * 0.15).toFixed(2), ZOOM_MIN, ZOOM_MAX));

  /**
   * Tab order runs through every node, but the map is a CSS transform inside an
   * overflow-hidden viewport — the browser cannot scroll a focused node into
   * view the way it would in a scroll container. Zoomed in on a hub, a keyboard
   * user therefore lands on nodes whose focus ring is off-screen. Nudge the pan
   * by the smallest amount that brings the node back inside.
   */
  const ensureVisible = (n: CNode) => {
    const { w, h } = sizeRef.current;
    if (!w || !h) return;
    const halfW = ((n.kind === "structure" ? 82 : 52) / 2 + 8) * scale;
    const halfH = halfW + 22 * scale; // the node's label hangs below it
    setPan((p) => {
      const sx = p.x + scale * (n.x - VIEW.w / 2);
      const sy = p.y + scale * (n.y - VIEW.h / 2);
      const limX = Math.max(0, w / 2 - halfW);
      const limY = Math.max(0, h / 2 - halfH);
      const dx = clamp(sx, -limX, limX) - sx;
      const dy = clamp(sy, -limY, limY) - sy;
      if (!dx && !dy) return p;
      return { x: clamp(p.x + dx, -900, 900), y: clamp(p.y + dy, -700, 700) };
    });
  };

  // Focus takes precedence over hover for what's emphasized.
  const focusSet = focused ? new Set<string>([focused, ...(STRUCTURE_CHILDREN[focused] ?? [])]) : null;
  const hoverSet = hovered ? new Set<string>([hovered, ...NEIGHBORS[hovered]]) : null;
  const active = focusSet ?? hoverSet;
  const hub = focused ? NODE_BY_ID[focused] : null;

  return (
    <div className="flex h-full flex-col">
      {/* Replaces the old static "Start anywhere" headline + flat badge list with
          a per-learner lead: resume, progress, and the next badge to chase. The
          map keeps the whole viewport below it. */}
      <LearnLead />

      <div
        ref={viewportRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className="bg-rule relative min-h-0 flex-1 cursor-grab touch-none overflow-hidden bg-base active:cursor-grabbing"
      >
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            width: VIEW.w,
            height: VIEW.h,
            transform: `translate(-50%,-50%) translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: "center",
            transition: dragging ? "none" : "transform var(--duration-slow) var(--ease-out)",
          }}
        >
          <svg
            viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
            width={VIEW.w}
            height={VIEW.h}
            className="absolute inset-0 overflow-visible"
            aria-hidden
          >
            <defs>
              {/* Arrowhead for the directed "builds on" spine: prerequisite →
                  dependent. Neutral ink, not a hue — direction is DRAWN, which is
                  the map's stated thesis ("wired by what builds on what"). */}
              <marker
                id="cn-arrow"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="5"
                markerHeight="5"
                orient="auto-start-reverse"
              >
                <path
                  d="M1.5,1.5 L9,5 L1.5,8.5"
                  fill="none"
                  stroke="var(--text-muted)"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </marker>
            </defs>
            {EDGES.map((e, i) => {
              const a = NODE_BY_ID[e.from];
              const b = NODE_BY_ID[e.to];
              if (!a || !b) return null;
              const on = active ? active.has(e.from) && active.has(e.to) : false;
              const dim = !!active && !on;
              const builds = e.kind === "builds";
              // Terminate at the node RIM, not its centre, so the edge visibly
              // TOUCHES each disc instead of dying under it. A line that ends at a
              // rim makes the claim "this attaches to that"; one buried under an
              // opaque disc reads as a smudge floating in the gap.
              const dx = b.x - a.x;
              const dy = b.y - a.y;
              const len = Math.hypot(dx, dy) || 1;
              const ux = dx / len;
              const uy = dy / len;
              const ra = (a.kind === "structure" ? 41 : 26) + 3;
              const rb = (b.kind === "structure" ? 41 : 26) + (builds ? 10 : 3); // room for the arrowhead
              const x1 = a.x + ux * ra;
              const y1 = a.y + uy * ra;
              const x2 = b.x - ux * rb;
              const y2 = b.y - uy * rb;
              // Contrast over --bg (computed, not eyeballed): spine --text-muted is
              // 8.98:1 dark / 6.53:1 light; "has" --text-faint is 6.08:1 / 4.46:1.
              // Both clear the 3:1 graphical-object floor in BOTH themes, which the
              // old --border-strong rest stroke (2.09:1 / 1.54:1) never could — the
              // literal cause of "it doesn't look connected." Hierarchy rides on
              // WEIGHT and ink strength, never hue.
              const restStroke = builds ? "var(--text-muted)" : "var(--text-faint)";
              return (
                <motion.line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={on ? "var(--text)" : restStroke}
                  strokeWidth={builds ? 2 : 1.25}
                  strokeLinecap="round"
                  markerEnd={builds ? "url(#cn-arrow)" : undefined}
                  initial={reduce ? false : { pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: dim ? 0.12 : 1 }}
                  transition={
                    reduce
                      ? { duration: 0 }
                      : {
                          pathLength: { duration: DUR.slow, delay: 0.12 + i * 0.01, ease: EASE_OUT },
                          opacity: { duration: DUR.base, ease: EASE_OUT },
                        }
                  }
                />
              );
            })}
          </svg>

          {NODES.map((n, i) => {
            const { done, total } = n.kind === "structure" ? hubProgress(n.id) : { done: 0, total: 0 };
            // A hub that has a Chapter links straight to it, so one click on the
            // structure opens the lesson — the direct way in the map previously
            // lacked. Hubs without a lesson keep the zoom-to-focus behaviour.
            const lessonMeta = n.kind === "structure" ? getLessonMeta(n.id) : undefined;
            return (
              <NodeDot
                key={n.id}
                n={n}
                i={i}
                href={lessonMeta ? `/learn/${n.id}` : n.href}
                solved={isSolved(n.id)}
                done={done}
                total={total}
                dim={active ? !active.has(n.id) : false}
                hot={hovered === n.id}
                boost={!!active && active.has(n.id) && (n.kind === "structure" || !!focusSet)}
                moved={moved}
                onPressStart={() => {
                  moved.current = false;
                }}
                onActivate={n.kind === "structure" && !lessonMeta ? () => focusHub(n.id) : undefined}
                onEnter={() => setHovered(n.id)}
                onLeave={() => setHovered(null)}
                onKeyboardFocus={() => ensureVisible(n)}
                reduce={!!reduce}
              />
            );
          })}
        </div>

        {/* Focus card */}
        {hub && (
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            className="absolute left-4 top-4 z-30 w-[min(19rem,calc(100%-2rem))] rounded-lg border border-line bg-surface/90 p-4 shadow-[var(--shadow-pop)] backdrop-blur"
          >
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full" style={{ background: hub.accent }} />
              <h3 className="text-sm font-semibold text-fg">{hub.label}</h3>
            </div>
            {BLURB[hub.id] && <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{BLURB[hub.id]}</p>}
            {(() => {
              // Per-hub progress in words — the ring on the node says the same
              // thing graphically, and neither is the only route to it.
              const { done, total } = hubProgress(hub.id);
              return (
                <p className="mt-2 text-xs text-fg-muted">
                  <span className="font-mono">
                    {done} / {total}
                  </span>{" "}
                  explored · click a node to dive in
                </p>
              );
            })()}
            {(() => {
              // A structure with a Chapter gets a way IN to the concept before
              // any problem — the thing the map previously never offered.
              const lessonMeta = getLessonMeta(hub.id);
              if (!lessonMeta) return null;
              return (
                <Link
                  href={`/learn/${hub.id}`}
                  className={cn(
                    "mt-3 flex h-8 w-full items-center justify-center gap-1.5 rounded-sm bg-accent px-2.5 text-sm font-semibold text-accent-fg",
                    "transition-[filter] duration-[var(--duration-fast)] hover:brightness-110",
                  )}
                >
                  <BookOpen className="size-3.5" aria-hidden />
                  Start: {lessonMeta.title}
                </Link>
              );
            })()}
            <button
              type="button"
              onClick={unfocus}
              className={cn(
                "mt-2 inline-flex h-8 items-center gap-1.5 rounded-sm border border-line-strong px-2.5 text-sm font-medium text-fg",
                "transition-colors duration-[var(--duration-fast)]",
                "hover:bg-surface-2 active:bg-surface-3",
              )}
            >
              <ArrowLeft className="size-3.5" />
              Back to the map
            </button>
          </motion.div>
        )}

        <div className="absolute bottom-4 right-4 flex flex-col gap-1.5">
          <ZoomBtn onClick={() => zoom(1)} label="Zoom in" disabled={scale >= ZOOM_MAX}>
            <Plus className="size-4" />
          </ZoomBtn>
          <ZoomBtn onClick={() => zoom(-1)} label="Zoom out" disabled={scale <= ZOOM_MIN}>
            <Minus className="size-4" />
          </ZoomBtn>
          <ZoomBtn onClick={unfocus} label="Reset the view">
            <Locate className="size-4" />
          </ZoomBtn>
        </div>

        {!focused && (
          <div className="pointer-events-none absolute bottom-4 left-4 hidden rounded-full border border-line bg-surface/80 px-3 py-1.5 text-xs text-fg-faint backdrop-blur sm:block">
            Drag to pan · click a node to open it · a hub to explore
          </div>
        )}
      </div>
    </div>
  );
}

function NodeDot({
  n,
  i,
  solved,
  done,
  total,
  dim,
  hot,
  boost,
  moved,
  onPressStart,
  onActivate,
  onEnter,
  onLeave,
  onKeyboardFocus,
  reduce,
  href,
}: {
  n: CNode;
  i: number;
  solved: boolean;
  /** Structure hubs only: problems explored / problems in this hub. */
  done: number;
  total: number;
  dim: boolean;
  hot: boolean;
  boost: boolean;
  /** Read-only here — the parent owns the write, via onPressStart. */
  moved: MutableRefObject<boolean>;
  onPressStart: () => void;
  onActivate?: () => void;
  onEnter: () => void;
  onLeave: () => void;
  onKeyboardFocus: () => void;
  /** prefers-reduced-motion: skip the entrance stagger, render final state. */
  reduce: boolean;
  /** Where the node links to — a hub's lesson when it has one, else its default. */
  href: string;
}) {
  const isStruct = n.kind === "structure";
  const size = isStruct ? 82 : 52;
  const Icon = isStruct ? STRUCT_ICON[n.structure] : null;
  const lit = solved || hot || boost;
  const showRing = isStruct && total > 0;
  const ringBox = size + 12;

  const label = isStruct
    ? `${n.label} — structure, ${done} of ${total} problem${total === 1 ? "" : "s"} explored`
    : `${n.label} — problem${solved ? ", explored" : ""}`;

  return (
    <motion.div
      className="absolute"
      style={{ left: n.x, top: n.y, transform: "translate(-50%,-50%)", zIndex: hot || boost ? 20 : isStruct ? 10 : 5 }}
      initial={reduce ? false : { opacity: 0, scale: 0.92 }}
      // dim raised from 0.28 to 0.42: at 0.28 a de-emphasised node computed
      // 1.31:1 in the light theme and effectively vanished, losing the learner's
      // place on the map. 0.42 recedes in both themes without disappearing.
      animate={{ opacity: dim ? 0.42 : 1, scale: 1 }}
      transition={
        reduce
          ? { duration: 0 }
          : {
              // No spring: an underdamped overshoot is bounce, and bounce is banned
              // on product UI. Entrance is a plain token ease.
              opacity: { duration: DUR.base, ease: EASE_OUT },
              scale: { duration: DUR.step, ease: EASE_OUT, delay: 0.08 + i * 0.012 },
            }
      }
    >
      <Link
        href={href}
        aria-label={label}
        onClick={(e) => {
          if (moved.current) {
            e.preventDefault();
            return;
          }
          if (onActivate) {
            e.preventDefault();
            onActivate();
          }
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          onPressStart();
        }}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        onFocus={(e) => {
          onEnter();
          // Only keyboard focus pans the map — doing it on click would yank the
          // canvas out from under the pointer.
          if (e.currentTarget.matches(":focus-visible")) onKeyboardFocus();
        }}
        onBlur={onLeave}
        className="group grid place-items-center rounded-full"
        style={{ "--node": n.accent } as CSSProperties}
      >
        <span
          className={cn(
            "relative grid place-items-center rounded-full border transition-[transform,box-shadow,border-color] duration-[var(--duration-base)]",
            isStruct ? "bg-surface" : "bg-elevated",
            hot || boost ? "scale-110" : "scale-100",
          )}
          style={{
            width: size,
            height: size,
            // Active / solved / hovered reads through INK + elevation, never a
            // hue — a node's identity is its icon, not a colour.
            borderColor: lit ? "var(--fg)" : "var(--border-strong)",
            boxShadow: lit ? "var(--lift-hi)" : "var(--lift)",
          }}
        >
          {/* Per-hub progress, ported from LearnPath's per-tier rings. The full
              circumference is drawn as a hairline track so the arc has a
              denominator you can see; pathLength={1} normalises the dash math.
              Decorative — the same count is in the focus card and aria-label. */}
          {showRing && (
            <svg
              className="pointer-events-none absolute -inset-1.5 -rotate-90"
              viewBox={`0 0 ${ringBox} ${ringBox}`}
              aria-hidden
            >
              <circle
                cx={ringBox / 2}
                cy={ringBox / 2}
                r={(size + 8) / 2}
                fill="none"
                stroke="var(--border)"
                strokeWidth={2}
              />
              {done > 0 && (
                <circle
                  cx={ringBox / 2}
                  cy={ringBox / 2}
                  r={(size + 8) / 2}
                  fill="none"
                  stroke="var(--node)"
                  strokeWidth={2}
                  strokeLinecap="round"
                  pathLength={1}
                  strokeDasharray={1}
                  strokeDashoffset={1 - done / total}
                  style={{ transition: "stroke-dashoffset var(--duration-slow) var(--ease-out)" }}
                />
              )}
            </svg>
          )}

          {isStruct && Icon ? (
            <Icon className="size-6" style={{ color: "var(--node)" }} />
          ) : (
            <span className="size-2.5 rounded-full" style={{ background: "var(--node)" }} />
          )}
          {solved && (
            <span className="absolute -right-0.5 -top-0.5 grid size-4.5 place-items-center rounded-full bg-base ring-2 ring-base">
              <Check className="size-3" style={{ color: "var(--node)" }} />
            </span>
          )}
        </span>
        <span
          className={cn(
            "pointer-events-none absolute left-1/2 top-full mt-1.5 -translate-x-1/2 whitespace-nowrap text-center font-medium transition-colors",
            isStruct ? "text-sm text-fg" : "text-2xs text-fg-muted group-hover:text-fg",
          )}
        >
          {n.label}
        </span>
      </Link>
    </motion.div>
  );
}

function ZoomBtn({
  children,
  onClick,
  label,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      disabled={disabled}
      className={cn(
        "grid size-9 place-items-center rounded-md border border-line bg-surface/90 text-fg-muted backdrop-blur",
        "transition-colors duration-[var(--duration-fast)]",
        "hover:border-line-strong hover:text-fg active:bg-surface-2",
        "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line disabled:hover:text-fg-muted",
      )}
    >
      {children}
    </button>
  );
}
