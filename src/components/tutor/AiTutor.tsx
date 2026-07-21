"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X, ArrowUp, CornerDownRight, ArrowRight } from "lucide-react";
import { usePlayer } from "@/engine/player/store";
import { useWorkspace } from "@/engine/player/workspace";
import { getExample } from "@/algorithms/registry";
import { getCustomSpec } from "@/algorithms/custom";
import { getLesson } from "@/curriculum/lessons";
import type { Problem } from "@/curriculum/catalog";
import { buttonVariants } from "@/design-system/ui/Button";
import { IconButton } from "@/design-system/ui/IconButton";
import { cn } from "@/lib/utils";

/**
 * Motion tokens, mirrored as numbers because motion/react cannot read a CSS
 * custom property. These are `--duration-base` / `--duration-slow` / `--ease-out`
 * from globals.css — not new curves. If those tokens change, change these.
 */
const D_BASE = 0.2;
const D_SLOW = 0.46;
const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

interface Msg {
  role: "user" | "assistant";
  text: string;
  actions?: string[];
  kind?: "error" | "key";
}

interface Action {
  name: string;
  input: Record<string, unknown>;
}

/** Snapshot the live workspace/player state to send Ada as grounding context. */
function buildContext(problem: Problem) {
  const p = usePlayer.getState();
  const step = p.trace?.steps[p.index];
  const ex = getExample(problem.slug);
  const spec = getCustomSpec(problem.slug);
  const lesson = getLesson(problem.slug);
  const customNote =
    spec.kind === "none"
      ? null
      : `${spec.note ?? (spec.kind === "numbers" ? "comma-separated integers" : "a raw string")}${
          spec.arg ? `; plus a ${spec.arg.label}` : ""
        }`;
  return {
    title: problem.title,
    topic: problem.topic,
    difficulty: problem.difficulty,
    time: lesson?.time,
    space: lesson?.space,
    code: p.trace?.code,
    stepIndex: p.index + 1,
    stepTotal: p.trace?.steps.length ?? 0,
    narration: step?.narration,
    vars: step?.vars,
    sceneKind: step?.scene.kind,
    datasets: ex?.datasets.map((d) => ({ id: d.id, label: d.label })) ?? [],
    datasetId: useWorkspace.getState().datasetId,
    custom: customNote,
  };
}

/**
 * Human label for a stored action WITHOUT executing it. Used when rehydrating a
 * saved conversation — reopening a problem should show what Ada did, not replay
 * it and yank the visualization around.
 */
function describeAction(a: Action, slug: string): string {
  switch (a.name) {
    case "goto_step":
      return `Jumped to step ${Math.max(1, Math.round(Number(a.input.step) || 1))}`;
    case "play":
      return "Started playback";
    case "pause":
      return "Paused";
    case "set_dataset": {
      const id = String(a.input.dataset_id ?? "");
      const ds = getExample(slug)?.datasets.find((d) => d.id === id);
      return ds ? `Switched to “${ds.label}”` : "";
    }
    case "run_custom_input":
      return `Ran on ${String(a.input.values ?? "")}`;
    default:
      return "";
  }
}

/** Execute one tool call Ada returned; give back a short human label of what happened. */
function runAction(a: Action, slug: string): string {
  const p = usePlayer.getState();
  switch (a.name) {
    case "goto_step": {
      // seek() clamps internally, so report the step we actually landed on —
      // echoing Ada's raw number would claim "step 99" while showing step 20.
      const total = p.trace?.steps.length ?? 0;
      if (!total) return "";
      const s = Math.min(Math.max(Math.round(Number(a.input.step) || 1), 1), total);
      p.seek(s - 1);
      return `Jumped to step ${s}`;
    }
    case "play":
      p.play();
      return "Started playback";
    case "pause":
      p.pause();
      return "Paused";
    case "set_dataset": {
      const id = String(a.input.dataset_id ?? "");
      const ds = getExample(slug)?.datasets.find((d) => d.id === id);
      if (!ds) return "";
      useWorkspace.getState().selectDataset(id);
      return `Switched to “${ds.label}”`;
    }
    case "run_custom_input": {
      const spec = getCustomSpec(slug);
      const raw = String(a.input.values ?? "");
      const valuesText = spec.kind === "string" ? raw.replace(/[\s,]+/g, "") : raw;
      const argText = a.input.target != null ? String(a.input.target) : "";
      const res = useWorkspace.getState().applyCustom(valuesText, argText);
      return res.ok
        ? `Ran on ${valuesText}${argText ? ` (target ${argText})` : ""}`
        : `Couldn't run that — ${res.error}`;
    }
    default:
      return "";
  }
}

/* ---------------------------------------------------------------------------
   Minimal markdown

   Ada writes `**bold**`, `inline code` and blank-line paragraph breaks, and
   nothing else. A markdown dependency would ship a parser (and usually an
   HTML sink) to cover three cases, so this handles exactly those three and
   renders everything else as literal text.

   Every piece lands in a React text node, so escaping is React's job and
   there is no dangerouslySetInnerHTML anywhere in this file. Unclosed
   delimiters — which is every reply mid-stream — simply render literally
   until the closing token arrives.
   -------------------------------------------------------------------------- */

type Piece = { t: "text" | "code" | "bold"; v: string };

function tokenizeInline(src: string): Piece[] {
  // Constructed per call: a shared /g regex carries lastIndex between calls.
  // Code is first in the alternation so `**a**` inside backticks stays literal.
  // Bold may not open or close on whitespace, which keeps Python exponentiation
  // written as prose ("n ** 2 ** m") from turning into a bold run.
  const re = /`([^`\n]+)`|\*\*(\S[\s\S]*?\S|\S)\*\*/g;
  const out: Piece[] = [];
  let last = 0;
  for (let m = re.exec(src); m !== null; m = re.exec(src)) {
    if (m.index > last) out.push({ t: "text", v: src.slice(last, m.index) });
    if (m[1] !== undefined) out.push({ t: "code", v: m[1] });
    else out.push({ t: "bold", v: m[2] });
    last = m.index + m[0].length;
  }
  if (last < src.length) out.push({ t: "text", v: src.slice(last) });
  return out;
}

function Prose({ text, className }: { text: string; className?: string }) {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (paragraphs.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)}>
      {paragraphs.map((para, i) => (
        <p key={i} className="whitespace-pre-wrap">
          {tokenizeInline(para).map((piece, j) =>
            piece.t === "code" ? (
              <code
                key={j}
                className="rounded-xs border border-line bg-surface-2 px-1 py-0.5 font-mono text-xs text-fg"
              >
                {piece.v}
              </code>
            ) : piece.t === "bold" ? (
              <strong key={j} className="font-semibold text-fg">
                {piece.v}
              </strong>
            ) : (
              <span key={j}>{piece.v}</span>
            ),
          )}
        </p>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

/**
 * In-progress readout. Deliberately static, following app/loading.tsx: an
 * animated indicator would have to be suppressed under reduced motion anyway,
 * and a still readout reads as "measuring", which is the register we want. It
 * is also not a progress bar — there is no real progress to report, and a fake
 * one would be depicting the product rather than being it.
 */
function ThinkingLine() {
  return (
    <div role="status">
      <p className="font-mono text-2xs text-fg-muted" aria-hidden>
        thinking…
      </p>
      <span className="sr-only">Ada is thinking</span>
    </div>
  );
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Live proof that Ada is wired to the canvas: the step she can currently see.
 * Isolated into its own component so playback re-renders this line and not the
 * whole transcript.
 */
function GroundingLine({ fallback }: { fallback: string }) {
  const index = usePlayer((s) => s.index);
  const total = usePlayer((s) => s.trace?.steps.length ?? 0);
  if (!total) return <span className="text-2xs text-fg-muted">{fallback}</span>;
  return (
    <span className="text-2xs text-fg-muted">
      reading step <span className="font-mono">{index + 1}</span> of{" "}
      <span className="font-mono">{total}</span>
    </span>
  );
}

/**
 * Starter questions grounded in the problem actually on screen — the complexity
 * from its lesson, and a real dataset from its registry entry. Nothing here is
 * invented copy about a generic algorithm.
 */
function useStarters(problem: Problem): string[] {
  return useMemo(() => {
    const lesson = getLesson(problem.slug);
    const out = ["Explain what is happening at this step"];
    if (lesson?.time) out.push(`Why is ${problem.title} ${lesson.time}?`);
    const edge = getExample(problem.slug)?.datasets.find((d) =>
      /worst|absent|invalid|reverse/i.test(`${d.id} ${d.label}`),
    );
    if (edge) out.push(`Run “${edge.label}” and walk me through what changes`);
    else if (getCustomSpec(problem.slug).kind !== "none") out.push("Run an input that breaks my intuition");
    else out.push("Where do people usually get this wrong?");
    return out.slice(0, 3);
  }, [problem.slug, problem.title]);
}

export function AiTutor({ problem }: { problem: Problem }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef(false);
  const pinBottom = useRef(true);

  const reduce = useReducedMotion();
  const starters = useStarters(problem);

  const close = useCallback(() => {
    restoreFocus.current = true;
    setOpen(false);
  }, []);

  // Focus moves into the panel on open and back to the launcher on close, so
  // the panel is never a keyboard dead end.
  useEffect(() => {
    if (open) {
      pinBottom.current = true;
      inputRef.current?.focus();
    } else if (restoreFocus.current) {
      restoreFocus.current = false;
      launcherRef.current?.focus();
    }
  }, [open]);

  // Follow the tail of the conversation, but never yank the view away from a
  // learner who has scrolled up to re-read something.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const force = pinBottom.current;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    if (!force && !atBottom) return;
    if (force && messages.length > 0) pinBottom.current = false;
    el.scrollTo({ top: el.scrollHeight, behavior: force || prefersReducedMotion() ? "auto" : "smooth" });
  }, [messages, loading, open]);

  // Rehydrate a saved conversation the first time the panel opens. Signed-out
  // users get an empty list — the tutor still works, it just doesn't remember.
  useEffect(() => {
    if (!open || historyLoaded) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/tutor/history?slug=${encodeURIComponent(problem.slug)}`);
        const data = await res.json();
        const prior: Msg[] = (data.messages ?? []).map(
          (m: { role: "user" | "assistant"; content: string; actions: Action[] | null }) => ({
            role: m.role,
            text: m.content,
            actions: (m.actions ?? []).map((a) => describeAction(a, problem.slug)).filter(Boolean),
          }),
        );
        // Don't clobber anything the learner has already typed this session.
        if (!cancelled && prior.length) setMessages((cur) => (cur.length ? cur : prior));
      } catch {
        /* history is a nice-to-have — never block opening the panel */
      } finally {
        if (!cancelled) setHistoryLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, historyLoaded, problem.slug]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const userMsg: Msg = { role: "user", text: trimmed };
    const history = [...messages, userMsg]
      .filter((m) => m.role === "user" || (m.role === "assistant" && !m.kind))
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.text }));

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: history, context: buildContext(problem), problemSlug: problem.slug }),
      });

      // Pre-stream outcomes (missing key, validation, upstream failure) come back
      // as JSON; a live reply comes back as an SSE stream.
      const isStream = (res.headers.get("content-type") ?? "").includes("text/event-stream");
      if (!isStream || !res.body) {
        const data = await res.json().catch(() => ({ error: "Ada sent something I couldn't read." }));
        if (data.needsKey) setMessages((prev) => [...prev, { role: "assistant", text: "", kind: "key" }]);
        else setMessages((prev) => [...prev, { role: "assistant", text: data.error ?? "Something went wrong.", kind: "error" }]);
        return;
      }

      // Streaming: one placeholder turn, filled as text deltas and tool actions
      // arrive. `acc` holds the running state; flush() rewrites the last turn.
      setMessages((prev) => [...prev, { role: "assistant", text: "" }]);
      const acc = { text: "", labels: [] as string[] };
      const flush = () =>
        setMessages((prev) => {
          const next = prev.slice();
          next[next.length - 1] = {
            role: "assistant",
            text: acc.text,
            actions: acc.labels.length ? acc.labels : undefined,
          };
          return next;
        });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let sawError = false;

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";
        for (const part of parts) {
          const dataLine = part.split("\n").find((l) => l.startsWith("data:"));
          if (!dataLine) continue;
          const payload = dataLine.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          let evt: { type: string; value?: string; name?: string; input?: Record<string, unknown>; message?: string };
          try {
            evt = JSON.parse(payload);
          } catch {
            continue;
          }
          if (evt.type === "text" && evt.value) {
            acc.text += evt.value;
            flush();
          } else if (evt.type === "tool_use" && evt.name) {
            // Tool events arrive after the prose, so the visualization jumps once
            // the reply has landed rather than mid-sentence.
            const label = runAction({ name: evt.name, input: evt.input ?? {} }, problem.slug);
            if (label) {
              acc.labels.push(label);
              flush();
            }
          } else if (evt.type === "error") {
            sawError = true;
            setMessages((prev) => {
              const next = prev.slice();
              next[next.length - 1] = { role: "assistant", text: evt.message ?? "Something went wrong.", kind: "error" };
              return next;
            });
          }
        }
      }

      // Empty reply with no actions and no error → the model whiffed; prompt a retry.
      if (!sawError && !acc.text && acc.labels.length === 0) {
        setMessages((prev) => {
          const next = prev.slice();
          next[next.length - 1] = { role: "assistant", text: "Hmm, I didn't catch that — mind rephrasing?" };
          return next;
        });
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "I couldn't reach the server. Is the dev server running?", kind: "error" },
      ]);
    } finally {
      setLoading(false);
    }
  }

  // True once the SSE placeholder turn exists, so the standalone indicator can
  // stand down and let that turn report its own progress.
  const lastMsg = messages[messages.length - 1];
  const streamingTurn = loading && lastMsg?.role === "assistant" && !lastMsg.kind;

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.button
            key="fab"
            ref={launcherRef}
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }}
            transition={reduce ? { duration: 0 } : { duration: D_BASE, ease: EASE_OUT }}
            onClick={() => setOpen(true)}
            className={cn(
              buttonVariants({ variant: "primary", size: "md" }),
              "fixed bottom-20 right-6 z-50 shadow-[var(--lift-hi),var(--shadow-pop)]",
            )}
          >
            Ask Ada
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            role="dialog"
            aria-label="Ada, your tutor"
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
            transition={reduce ? { duration: 0 } : { duration: D_SLOW, ease: EASE_OUT }}
            onKeyDown={(e) => {
              // The panel owns its keys while it is focused: the global playback
              // hotkeys (space, arrows, r, Home/End) must not fire underneath a
              // learner who is reading or tabbing through the transcript.
              e.stopPropagation();
              if (e.key === "Escape") {
                e.preventDefault();
                close();
              }
            }}
            className="fixed bottom-6 right-6 z-50 flex h-[min(34rem,calc(100vh-5rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-[var(--lift),var(--shadow-modal)]"
          >
            <header className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-4 py-3">
              <div className="min-w-0 leading-tight">
                <h2 className="text-base font-medium text-fg">Ada</h2>
                <GroundingLine fallback={problem.title} />
              </div>
              <IconButton onClick={close} aria-label="Close tutor (Escape)" className="-mr-1.5 shrink-0">
                <X className="size-4" aria-hidden />
              </IconButton>
            </header>

            {/* Transcript. tabIndex makes it keyboard-scrollable; aria-live is off
                because a token-by-token stream would flood a screen reader — the
                status line below announces instead. */}
            <div
              ref={scrollRef}
              tabIndex={0}
              role="log"
              aria-live="off"
              aria-label="Conversation with Ada"
              className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 focus-visible:-outline-offset-2"
            >
              {messages.length === 0 && historyLoaded && (
                <EmptyState starters={starters} onPick={send} disabled={loading} />
              )}

              {messages.map((m, i) =>
                m.kind === "key" ? (
                  <KeyCard key={i} />
                ) : m.role === "user" ? (
                  <p key={i} className="whitespace-pre-wrap text-md font-medium text-fg">
                    <span className="sr-only">You asked: </span>
                    {m.text}
                  </p>
                ) : (
                  <div
                    key={i}
                    className={cn("border-l pl-3", m.kind === "error" ? "border-line-strong" : "border-line")}
                  >
                    <p className="mb-1 font-mono text-2xs text-fg-muted">
                      {m.kind === "error" ? "ada — not delivered" : "ada"}
                    </p>
                    {m.text && <Prose text={m.text} className="text-md text-fg" />}
                    {/* The streaming placeholder carries its own status, so the
                        turn and the indicator never both claim to be Ada. */}
                    {!m.text && loading && i === messages.length - 1 && <ThinkingLine />}
                    {m.actions && m.actions.length > 0 && (
                      <ul className={cn("space-y-1", m.text && "mt-2")}>
                        {m.actions.map((a, j) => (
                          <li
                            key={j}
                            className="flex w-fit items-center gap-1.5 rounded-sm border border-line bg-surface-2 px-2 py-1 font-mono text-2xs text-fg-muted"
                          >
                            <CornerDownRight className="size-3 shrink-0" aria-hidden />
                            {a}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ),
              )}

              {/* Only while no assistant turn has been opened yet — once the
                  stream creates its placeholder, that turn shows the status. */}
              {loading && !streamingTurn && (
                <div className="border-l border-line pl-3">
                  <p className="mb-1 font-mono text-2xs text-fg-muted" aria-hidden>
                    ada
                  </p>
                  <ThinkingLine />
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex shrink-0 items-center gap-2 border-t border-line px-3 py-3"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Ada about this step"
                aria-label="Ask Ada about this step"
                className="h-10 min-w-0 flex-1 rounded-md border border-line bg-base px-3 text-base text-fg transition-colors duration-[var(--duration-fast)] ease-out placeholder:text-fg-faint hover:border-line-strong focus:border-line-strong"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className={cn(buttonVariants({ variant: "primary", size: "md" }), "w-10 shrink-0 px-0")}
                aria-label="Send"
              >
                <ArrowUp className="size-4" aria-hidden />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/**
 * The first-run state. It teaches what Ada is wired to — that she can drive the
 * visualization, and that she will not just hand over the answer — and offers
 * openers grounded in the problem currently on screen.
 */
function EmptyState({
  starters,
  onPick,
  disabled,
}: {
  starters: string[];
  onPick: (q: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2 text-md text-fg-muted">
        <p>
          I can see what you can see — the step you are on, your variables, and the input that is loaded.
          Ask about any of it and I can drive the visualization to answer: jump to a step, switch the
          dataset, or run your own input.
        </p>
        <p>I will not hand you the solution. I will find where your model of it breaks, and push there.</p>
      </div>

      <div className="space-y-1.5">
        <p className="font-mono text-2xs text-fg-muted">start with</p>
        {starters.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onPick(s)}
            disabled={disabled}
            className="group flex w-full items-center justify-between gap-3 rounded-md border border-line bg-surface-2 px-3 py-2 text-left text-base text-fg-muted transition-colors duration-[var(--duration-fast)] ease-out hover:border-line-strong hover:bg-surface-3 hover:text-fg active:bg-surface-3 disabled:pointer-events-none disabled:opacity-50"
          >
            {s}
            <ArrowRight
              className="size-3.5 shrink-0 text-fg-faint transition-colors duration-[var(--duration-fast)] ease-out group-hover:text-fg"
              aria-hidden
            />
          </button>
        ))}
      </div>
    </div>
  );
}

function KeyCard() {
  return (
    <div className="rounded-lg border border-line bg-base p-3 text-base text-fg-muted shadow-[var(--lift)]">
      <p className="mb-2 font-medium text-fg">Almost there — add an API key</p>
      <p>To turn Ada on, add your OpenRouter key to a file at the project root:</p>
      <pre className="my-2 overflow-x-auto rounded-sm border border-line bg-surface-2 px-3 py-2 text-xs text-fg">
        <code>
          # .env.local{"\n"}
          OPENROUTER_API_KEY=sk-or-…
        </code>
      </pre>
      <p>
        Get one at <span className="font-medium text-fg">openrouter.ai/keys</span>, then restart the dev
        server. There&rsquo;s a free tier — see <span className="font-medium text-fg">.env.local.example</span>.
      </p>
    </div>
  );
}
