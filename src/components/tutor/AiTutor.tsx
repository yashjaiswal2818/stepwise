"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Sparkles, X, ArrowUp } from "lucide-react";
import { usePlayer } from "@/engine/player/store";
import { useWorkspace } from "@/engine/player/workspace";
import { getExample } from "@/algorithms/registry";
import { getCustomSpec } from "@/algorithms/custom";
import { getLesson } from "@/curriculum/lessons";
import type { Problem } from "@/curriculum/catalog";
import { cn } from "@/lib/utils";

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

export function AiTutor({ problem }: { problem: Problem }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const lesson = getLesson(problem.slug);
  const suggestions = [
    "Explain this step",
    lesson ? `Why is it ${lesson.time}?` : "Explain the approach",
    "Show me the worst case",
    "Quiz me on this",
  ];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

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

      // Streaming: one placeholder bubble, filled as text deltas and tool actions
      // arrive. `acc` holds the running state; flush() rewrites the last bubble.
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

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.button
            key="fab"
            initial={false}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-20 right-6 z-50 flex items-center gap-2 rounded-full bg-brand px-4 py-3 text-sm font-semibold text-white shadow-xl shadow-brand/25"
            aria-label="Ask Ada, the AI tutor"
          >
            <Sparkles className="h-4 w-4" />
            Ask Ada
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="fixed bottom-6 right-6 z-50 flex h-[min(34rem,calc(100vh-5rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-soft text-brand-strong">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div className="leading-tight">
                  <p className="text-sm font-semibold text-fg">Ada</p>
                  <p className="text-[11px] text-fg-faint">your AI tutor</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-fg-faint transition-colors hover:bg-surface-2 hover:text-fg"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.length === 0 && (
                <div className="space-y-3">
                  <p className="text-[13px] leading-relaxed text-fg-muted">
                    Hi! I&apos;m Ada. I can see what&apos;s on your canvas — ask me to explain a step, run your
                    own input, or show a tricky case, and I&apos;ll drive the visualization for you.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="rounded-full border border-line bg-base px-2.5 py-1 text-[12px] text-fg-muted transition-colors hover:border-brand hover:text-fg"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) =>
                m.kind === "key" ? (
                  <KeyCard key={i} />
                ) : (
                  <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed",
                        m.role === "user"
                          ? "bg-brand text-white"
                          : m.kind === "error"
                            ? "bg-rose-500/10 text-rose-500"
                            : "bg-surface-2 text-fg",
                      )}
                    >
                      {m.text && <p className="whitespace-pre-wrap">{m.text}</p>}
                      {m.actions && m.actions.length > 0 && (
                        <div className={cn("flex flex-col gap-1", m.text && "mt-2")}>
                          {m.actions.map((a, j) => (
                            <span key={j} className="text-[11px] font-medium text-brand-strong">
                              ▸ {a}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ),
              )}

              {loading && (
                <div className="flex justify-start">
                  <div className="flex gap-1 rounded-2xl bg-surface-2 px-3 py-3">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="h-1.5 w-1.5 rounded-full bg-fg-faint"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Composer */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex items-center gap-2 border-t border-line px-3 py-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Ada anything…"
                className="min-w-0 flex-1 rounded-xl border border-line bg-base px-3 py-2 text-[13px] text-fg outline-none focus:border-brand"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand text-white transition-opacity disabled:opacity-40"
                aria-label="Send"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function KeyCard() {
  return (
    <div className="rounded-xl border border-line bg-base p-3 text-[13px] leading-relaxed text-fg-muted">
      <p className="mb-2 font-semibold text-fg">Almost there — add an API key</p>
      <p>To turn Ada on, add your OpenRouter key to a file at the project root:</p>
      <pre className="my-2 overflow-x-auto rounded-lg bg-surface-2 px-3 py-2 text-[12px] text-fg">
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
