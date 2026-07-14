"use client";

import { motion } from "motion/react";
import { RotateCcw, SkipBack, Play, SkipForward } from "lucide-react";

const kw = "text-[#c4b5fd]";
const fn = "text-[#7dd3fc]";
const num = "text-[#fbbf24]";
const pn = "text-fg-faint";

/* right-side canvas geometry */
const W = 30, GAP = 8, N = 7, START = 21, Y = 40, H = 42;
const slot = (i: number) => START + i * (W + GAP);
const VALS = [5, 2, 8, 3, 9, 6, 7];

function Cell({ i, kind }: { i: number; kind: "idle" | "final" }) {
  const fill = kind === "final" ? "color-mix(in oklab, var(--state-final) 16%, var(--surface))" : "var(--state-default)";
  const stroke = kind === "final" ? "var(--state-final)" : "var(--state-default-border)";
  const tc = kind === "final" ? "var(--state-final)" : "var(--state-default-fg)";
  return (
    <g>
      <rect x={slot(i)} y={Y} width={W} height={H} rx={8} fill={fill} stroke={stroke} strokeWidth={1.4} />
      <text x={slot(i) + W / 2} y={Y + 27} textAnchor="middle" fontSize="16" fontWeight="600" fill={tc} fontFamily="var(--font-geist-mono)">{VALS[i]}</text>
    </g>
  );
}

function SwapCell({ from, to, delay }: { from: number; to: number; delay: number }) {
  const a = slot(from), b = slot(to);
  const i = from;
  return (
    <motion.g
      animate={{ x: [0, b - a, b - a, 0], y: [0, -12, 0, 0] }}
      transition={{ duration: 3.6, times: [0, 0.35, 0.7, 1], ease: "easeInOut", repeat: Infinity, repeatDelay: 0.4, delay }}
    >
      <rect x={a} y={Y} width={W} height={H} rx={8} fill="color-mix(in oklab, var(--state-swap) 20%, var(--surface))" stroke="var(--state-swap)" strokeWidth={1.8} />
      <text x={a + W / 2} y={Y + 27} textAnchor="middle" fontSize="16" fontWeight="700" fill="var(--state-swap)" fontFamily="var(--font-geist-mono)">{VALS[i]}</text>
    </motion.g>
  );
}

function HeroCanvas() {
  return (
    <svg viewBox="0 0 300 108" className="h-full w-full" fill="none">
      {/* compare bracket over the swapping pair */}
      <motion.rect
        x={slot(2) - 4} y={Y - 5} width={W * 2 + GAP + 8} height={H + 10} rx={11}
        fill="color-mix(in oklab, var(--state-compare) 8%, transparent)" stroke="var(--state-compare)" strokeWidth={1.4} strokeDasharray="5 4"
        animate={{ opacity: [0.35, 0.9, 0.35] }}
        transition={{ duration: 2, ease: "easeInOut", repeat: Infinity }}
      />
      <Cell i={0} kind="idle" />
      <Cell i={1} kind="idle" />
      <SwapCell from={2} to={3} delay={0} />
      <SwapCell from={3} to={2} delay={0} />
      <Cell i={4} kind="idle" />
      <Cell i={5} kind="final" />
      <Cell i={6} kind="final" />
      {/* index ticks */}
      {VALS.map((_, i) => (
        <text key={i} x={slot(i) + W / 2} y={Y + H + 15} textAnchor="middle" fontSize="9" fill="var(--text-faint)" fontFamily="var(--font-geist-mono)">{i}</text>
      ))}
    </svg>
  );
}

const CODE: React.ReactNode[] = [
  <><span className={kw}>function</span> <span className={fn}>bubbleSort</span><span className={pn}>(</span>a<span className={pn}>) {"{"}</span></>,
  <><span className={kw}>for</span> <span className={pn}>(</span><span className={kw}>let</span> n = a.length; n {">"} <span className={num}>1</span>; n--<span className={pn}>) {"{"}</span></>,
  <><span className={kw}>for</span> <span className={pn}>(</span><span className={kw}>let</span> j = <span className={num}>0</span>; j {"<"} n-<span className={num}>1</span>; j++<span className={pn}>) {"{"}</span></>,
  <><span className={kw}>if</span> <span className={pn}>(</span>a<span className={pn}>[</span>j<span className={pn}>]</span> {">"} a<span className={pn}>[</span>j+<span className={num}>1</span><span className={pn}>])</span></>,
  <><span className={fn}>swap</span><span className={pn}>(</span>a, j, j+<span className={num}>1</span><span className={pn}>);</span></>,
  <span className={pn}>{"}"}</span>,
  <span className={pn}>{"}"}</span>,
  <><span className={kw}>return</span> a<span className={pn}>;</span></>,
  <span className={pn}>{"}"}</span>,
];
const INDENT = [0, 1, 2, 3, 4, 2, 1, 1, 0];
const ACTIVE = 3;

export function HeroPreview() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow-lg)]">
      {/* titlebar */}
      <div className="flex items-center gap-3 border-b border-line bg-surface-2 px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="size-3 rounded-full bg-[#ff5f57]" />
          <span className="size-3 rounded-full bg-[#febc2e]" />
          <span className="size-3 rounded-full bg-[#28c840]" />
        </div>
        <div className="ml-1 flex items-center gap-2 rounded-md bg-surface px-2.5 py-1 text-xs text-fg-muted">
          <span className="font-mono">bubble_sort.ts</span>
        </div>
        <span className="ml-auto rounded-full border border-easy/30 bg-easy/10 px-2 py-0.5 text-[11px] font-semibold text-easy">Easy</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,0.9fr)_1.1fr]">
        {/* code */}
        <div className="hidden border-r border-line bg-elevated py-3 md:block">
          {CODE.map((line, i) => {
            const active = i === ACTIVE;
            return (
              <div
                key={i}
                className={`relative flex items-center gap-3 py-[3px] pr-3 font-mono text-[12.5px] leading-relaxed ${active ? "bg-brand-soft" : ""}`}
              >
                {active && <motion.span layoutId="hero-code-cursor" className="absolute left-0 top-0 h-full w-[2.5px] bg-brand" />}
                <span className="w-7 shrink-0 select-none text-right text-fg-faint/60">{i + 1}</span>
                <span style={{ paddingLeft: INDENT[i] * 12 }} className="text-fg">{line}</span>
              </div>
            );
          })}
        </div>

        {/* canvas + controls */}
        <div className="bg-grid flex flex-col">
          <div className="flex-1 px-3 pt-4">
            <HeroCanvas />
          </div>
          {/* narration */}
          <div className="px-4 pb-1">
            <p className="font-mono text-[11px] text-fg-muted">
              <span className="text-state-swap">swap</span> a[2] and a[3] &nbsp;·&nbsp; 8 {">"} 3
            </p>
          </div>
          {/* controls */}
          <div className="flex items-center gap-3 border-t border-line px-4 py-2.5">
            <div className="flex items-center gap-1 text-fg-muted">
              <RotateCcw className="size-4" />
              <SkipBack className="size-4" />
              <span className="mx-0.5 grid size-8 place-items-center rounded-full bg-brand text-brand-fg shadow-[var(--shadow-glow)]">
                <Play className="size-4 translate-x-px fill-current" />
              </span>
              <SkipForward className="size-4" />
            </div>
            <span className="rounded-md border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-fg-muted">1.5×</span>
            <div className="relative mx-1 h-1 flex-1 overflow-hidden rounded-full bg-surface-3">
              <div className="absolute inset-y-0 left-0 w-[30%] rounded-full bg-brand" />
            </div>
            <span className="shrink-0 font-mono text-[11px] text-fg-muted">Step 7 / 24</span>
          </div>
        </div>
      </div>
    </div>
  );
}
