import { createHash } from "node:crypto";
import { rateLimit } from "@/lib/ratelimit";
import { getCurrentUser } from "@/lib/dal";
import { appendMessage, ensureConversation, type StoredAction } from "@/lib/conversations";

// The key is read server-side only and never reaches the browser — pin to the
// Node runtime rather than edge, which keeps env handling boring and predictable.
export const runtime = "nodejs";
// Hobby ceiling; only matters when deployed. Ada's replies are short, so this is
// headroom, not a limit we expect to hit.
export const maxDuration = 60;

// Ada runs on OpenRouter. Any tool-capable model slug works; override via env.
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "tencent/hy3:free";

interface ToolDef {
  name: string;
  description: string;
  schema: Record<string, unknown>;
}

/**
 * Ada's tools, mapped to OpenRouter's wire format below.
 *
 * Every object closes itself with `additionalProperties: false` and an explicit
 * `required` array, so the model is told exactly what it may pass. Optional
 * params (`target`) are expressed by omission from `required`.
 */
const TOOLS: ToolDef[] = [
  {
    name: "goto_step",
    description:
      "Jump the visualization to a specific step (1-based, as shown in 'Step X / N'). Use it to point the learner at the exact moment you're explaining.",
    schema: {
      type: "object",
      properties: { step: { type: "integer", description: "1-based step number" } },
      required: ["step"],
      additionalProperties: false,
    },
  },
  {
    name: "play",
    description: "Start automatic playback from the current step.",
    schema: { type: "object", properties: {}, required: [], additionalProperties: false },
  },
  {
    name: "pause",
    description: "Pause playback.",
    schema: { type: "object", properties: {}, required: [], additionalProperties: false },
  },
  {
    name: "set_dataset",
    description:
      "Switch to one of the curated datasets for this problem. Use the exact dataset id from the context (e.g. to show a best or worst case).",
    schema: {
      type: "object",
      properties: { dataset_id: { type: "string", description: "Exact curated dataset id" } },
      required: ["dataset_id"],
      additionalProperties: false,
    },
  },
  {
    name: "run_custom_input",
    description:
      "Re-run the current algorithm on new input — either what the learner gave you, or an input you pick to demonstrate a case. Only use when the context says custom input is supported.",
    schema: {
      type: "object",
      properties: {
        values: {
          type: "string",
          description:
            "Number examples: comma-separated integers, e.g. '5, 1, 4, 2, 8'. String examples: the raw string, e.g. 'abcabcbb'.",
        },
        target: {
          type: "number",
          description: "Optional target/goal when the problem needs one (search target, target sum).",
        },
      },
      required: ["values"],
      additionalProperties: false,
    },
  },
];

interface TutorContext {
  title: string;
  topic: string;
  difficulty: string;
  time?: string;
  space?: string;
  code?: string;
  stepIndex: number;
  stepTotal: number;
  narration?: string;
  vars?: Record<string, unknown>;
  sceneKind?: string;
  datasets: { id: string; label: string }[];
  datasetId: string;
  custom: string | null;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function systemPrompt(ctx: TutorContext): string {
  const vars =
    ctx.vars && Object.keys(ctx.vars).length
      ? Object.entries(ctx.vars)
          .map(([k, v]) => `${k}=${v}`)
          .join(", ")
      : "none";
  const datasets = ctx.datasets.map((d) => `${d.id} — ${d.label}`).join("; ") || "none";
  const custom = ctx.custom
    ? `supported. When running custom input, format values as: ${ctx.custom}`
    : "not available for this example (it uses a fixed structure)";

  return [
    "You are Ada, a warm, concise DSA tutor built into Stepwise, an interactive algorithm-visualization app.",
    "You teach absolute beginners. Explain in plain language and short paragraphs, tie every idea to what's on screen right now, and define any term you use in a few words. Favor intuition over formalism.",
    "",
    "How you teach — this is the part that matters:",
    "- The learner's own thinking is the product. Your job is to find where it breaks and nudge it one step, not to replace it with your answer.",
    "- Never hand over the approach or the solution on a first ask. If they ask how to solve the problem, ask what they've already tried, then give the smallest push that unblocks them.",
    "- The reference code on screen (in the code panel) is the full solution. It being visible is NOT a licence to hand it over. If they ask you to paste, write, or 'just give' the code, don't reproduce it — point them to the panel that's already there and offer to build understanding of it one piece at a time.",
    "- When they ask which approach or data structure to use, do NOT rank the options and explain why one wins — for most problems that choice IS the whole insight. Ask what they'd expect each one to cost, or what the structure on screen buys them, and let them reach the trade-off themselves.",
    "- One question at a time. One hint at a time. Wait for their answer before the next one.",
    "- Escalate only after two or three real attempts. Then give a bigger hint — still not the whole answer.",
    "- When they're wrong, don't just correct them. Point at the thing on screen that contradicts them and let them notice it themselves.",
    "- After they work something out, ask them to say it back in their own words. That's what makes it stick.",
    "",
    "Where that stops applying — over-withholding is its own failure, so read this carefully:",
    "- Explaining what is on screen right now is always fine. That is what this app is for. If they ask you to explain this step, explain this step.",
    "- Definitions, complexity, and syntax are facts, not answers. Just tell them.",
    "- If they are lost rather than stuck — no idea where to begin, or going in circles — a question won't help. Give them a concrete foothold and get them moving again.",
    "- Never refuse to help. Withholding the answer is not the same as withholding help. If they have genuinely worked at it and are still stuck, help them.",
    "",
    "You can control the visualization with tools. When the learner asks to see, run, jump to, play, pause, or try something, CALL the matching tool AND briefly say what you did in one sentence. Always include a short text reply alongside any tool call. Never reference a step or dataset that isn't in the context below.",
    "A tool call never replaces substance. Showing complements telling — a jump must come WITH a sentence of reasoning or a question, never on its own. And never jump to the step that's already on screen; that does nothing. If a question is conceptual, answer the concept (or ask a leading question); don't deflect into a tool call.",
    "Keep replies tight — aim for 60–100 words, and don't exceed ~120 unless the learner explicitly asks you to go deeper. A long answer does their thinking for them.",
    "",
    `Current problem: ${ctx.title} (${ctx.topic}, ${ctx.difficulty}).`,
    ctx.time ? `Complexity: time ${ctx.time}, space ${ctx.space}.` : "",
    ctx.code ? `JavaScript reference:\n\`\`\`js\n${ctx.code.slice(0, 4000)}\n\`\`\`` : "",
    "",
    "Where the learner is right now:",
    `- Step ${ctx.stepIndex} of ${ctx.stepTotal}: ${ctx.narration ?? ""}`,
    `- Variables in scope: ${vars}`,
    `- Structure on screen: ${ctx.sceneKind ?? "unknown"}`,
    "",
    `Curated datasets (id — label): ${datasets}. Currently showing: ${ctx.datasetId}.`,
    `Custom input: ${custom}.`,
  ]
    .filter(Boolean)
    .join("\n");
}

// ---- OpenRouter (OpenAI-compatible, streamed) ----

const SSE_HEADERS = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
};

/** One typed envelope event, framed as an SSE `data:` line. The client parses
 *  these; keeping the envelope typed (not raw text) is what lets tool actions
 *  ride the same channel as prose. */
function sse(event: { type: "text"; value: string } | { type: "tool_use"; name: string; input: Record<string, unknown> } | { type: "error"; message: string }): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

/** POST to OpenRouter with streaming on. Retries once without tools if the model
 *  rejects tool-calling (many free models do), then throws on any pre-stream
 *  failure so the caller can return a clean JSON error before headers are sent. */
async function connectOpenRouter(system: string, messages: ChatMessage[], withTools = true): Promise<Response> {
  const body: Record<string, unknown> = {
    model: OPENROUTER_MODEL,
    max_tokens: 900,
    temperature: 0.5,
    stream: true,
    messages: [{ role: "system", content: system }, ...messages],
  };
  if (withTools) {
    body.tools = TOOLS.map((t) => ({
      type: "function",
      function: { name: t.name, description: t.description, parameters: t.schema },
    }));
  }

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    // `cache: "no-store"` is load-bearing: Next.js patches global fetch and will
    // buffer the response body to cache it, which deadlocks a streaming body —
    // the upstream sends a couple of keep-alives and then our reader stalls.
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost",
      "X-Title": "Stepwise",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok || !res.body) {
    const errText = await res.text().catch(() => "");
    // Free/small models often can't tool-call — drop tools and retry once.
    if (withTools && /tool|function/i.test(errText)) return connectOpenRouter(system, messages, false);
    let msg = `OpenRouter error ${res.status}`;
    try {
      msg = JSON.parse(errText)?.error?.message || msg;
    } catch {
      /* non-JSON error body — keep the status message */
    }
    throw new Error(msg);
  }
  return res;
}

/** Transform OpenRouter's OpenAI-format SSE into our typed envelope: text deltas
 *  stream through immediately; tool-call fragments (which arrive split across
 *  deltas, keyed by index) are accumulated and flushed as complete `tool_use`
 *  events once the upstream stream ends.
 *
 *  The upstream is drained by an EAGER pump loop in start(), not a pull()
 *  callback. A pull-gated reader deadlocks here: OpenRouter opens with keep-alive
 *  comment lines that produce no envelope events, so nothing gets enqueued;
 *  Next then won't flush response headers (no first byte) and stops driving
 *  pull, which stops us reading the upstream — headers never flush. Enqueueing an
 *  opening comment up front flushes headers immediately, and the pump reads the
 *  upstream on its own schedule regardless of the consumer's backpressure. */
interface LogCtx {
  ipTag: string;
  model: string;
  startedAt: number;
  /** Set only for signed-in users — the conversation to append the reply to. */
  conversationId?: string | null;
}

function envelopeStream(upstream: Response, log: LogCtx): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const reader = upstream.body!.getReader();
  const tools = new Map<number, { name: string; args: string }>();
  let usage: { prompt_tokens?: number; completion_tokens?: number } | undefined;
  let fullText = ""; // accumulated for persistence; deltas still stream immediately
  let buffer = "";

  // If the client disconnects mid-reply the controller closes; enqueue/close
  // after that throws. Guard both so a disconnect can't raise an unhandled
  // rejection out of the un-awaited pump below.
  let closed = false;

  return new ReadableStream<Uint8Array>({
    start(controller) {
      const safeEnqueue = (bytes: Uint8Array) => {
        if (closed) return;
        try {
          controller.enqueue(bytes);
        } catch {
          closed = true;
        }
      };
      const safeClose = () => {
        if (closed) return;
        closed = true;
        try {
          controller.close();
        } catch {
          /* already closed by a client disconnect */
        }
      };

      // Open comment → first byte → Next flushes headers now, not after the model.
      safeEnqueue(encoder.encode(": open\n\n"));

      void (async () => {
        try {
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? ""; // keep the trailing partial line

            for (const raw of lines) {
              const line = raw.trim();
              if (!line || line.startsWith(":")) continue; // blank / keep-alive comment
              if (!line.startsWith("data:")) continue;
              const payload = line.slice(5).trim();
              if (payload === "[DONE]") continue;

              let chunk: {
                error?: { message?: string };
                usage?: { prompt_tokens?: number; completion_tokens?: number };
                choices?: { delta?: { content?: string; tool_calls?: { index?: number; function?: { name?: string; arguments?: string } }[] } }[];
              };
              try {
                chunk = JSON.parse(payload);
              } catch {
                continue; // partial or non-JSON line — ignore
              }

              if (chunk.usage) usage = chunk.usage; // final chunk carries token counts

              if (chunk.error) {
                safeEnqueue(encoder.encode(sse({ type: "error", message: chunk.error.message || "Ada hit an error." })));
                continue;
              }

              const delta = chunk.choices?.[0]?.delta;
              if (!delta) continue;

              if (typeof delta.content === "string" && delta.content) {
                fullText += delta.content;
                safeEnqueue(encoder.encode(sse({ type: "text", value: delta.content })));
              }
              if (Array.isArray(delta.tool_calls)) {
                for (const tc of delta.tool_calls) {
                  const idx = tc.index ?? 0;
                  const cur = tools.get(idx) ?? { name: "", args: "" };
                  if (tc.function?.name) cur.name = tc.function.name;
                  if (tc.function?.arguments) cur.args += tc.function.arguments;
                  tools.set(idx, cur);
                }
              }
            }
          }

          // Upstream done: flush any accumulated tool calls as complete events.
          const executed: StoredAction[] = [];
          for (const { name, args } of tools.values()) {
            if (!name) continue;
            let input: Record<string, unknown> = {};
            try {
              input = JSON.parse(args || "{}");
            } catch {
              continue; // malformed tool args — skip rather than emit a broken action
            }
            executed.push({ name, input });
            safeEnqueue(encoder.encode(sse({ type: "tool_use", name, input })));
          }
          safeClose();
          logLine({
            ev: "done",
            ip: log.ipTag,
            model: log.model,
            ms: Date.now() - log.startedAt,
            in_tokens: usage?.prompt_tokens ?? null,
            out_tokens: usage?.completion_tokens ?? null,
            tools: tools.size,
          });

          // Persist the reply for signed-in users. Runs after the stream closes so
          // it never delays delivery, and never throws into the response.
          if (log.conversationId && (fullText || executed.length)) {
            try {
              await appendMessage(log.conversationId, "assistant", fullText, executed);
            } catch (err) {
              logLine({ ev: "persist_err", ip: log.ipTag, msg: err instanceof Error ? err.message : "unknown" });
            }
          }
        } catch {
          safeEnqueue(encoder.encode(sse({ type: "error", message: "Lost the connection to Ada mid-reply." })));
          safeClose();
          logLine({ ev: "stream_err", ip: log.ipTag, model: log.model, ms: Date.now() - log.startedAt });
        }
      })();
    },
    cancel() {
      closed = true; // client disconnected — stop the pump from enqueueing
      reader.cancel().catch(() => {});
    },
  });
}

/** Client IP for rate-limiting. `req.ip` was removed in Next 15/16, so we read
 *  the proxy headers. Prefer x-real-ip — Vercel sets it to the single real client
 *  IP — over x-forwarded-for, whose leftmost entry is a client-supplied chain and
 *  so more easily spoofed. Header-based IP is best-effort; the Vercel spend cap is
 *  the real backstop. "local" groups dev traffic (no forwarding headers). */
function clientIp(req: Request): string {
  return (
    req.headers.get("x-real-ip")?.trim() ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "local"
  );
}

/** Stable, non-reversible per-IP tag so logs can correlate one user's requests
 *  without storing their IP. */
function ipTag(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 8);
}

/** One structured line per event. The platform stamps time; we stay data-only
 *  and never log prompt content or the raw IP. */
function logLine(fields: Record<string, unknown>): void {
  try {
    console.log(JSON.stringify(fields));
  } catch {
    /* never let logging throw into the request path */
  }
}

export async function POST(req: Request) {
  const startedAt = Date.now();
  if (!process.env.OPENROUTER_API_KEY) return Response.json({ needsKey: true });

  let body: { messages?: ChatMessage[]; context?: TutorContext; problemSlug?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  const { messages, context, problemSlug } = body;
  if (!messages?.length || !context) {
    return Response.json({ error: "Missing messages or context." }, { status: 400 });
  }

  // Signed-in users get their own rate-limit budget keyed by user id; anonymous
  // users keep sharing the IP bucket. The anonymous path stays open either way.
  const user = await getCurrentUser();
  const ip = clientIp(req);
  const rlKey = user ? `u:${user.id}` : ip;
  const tag = user ? `u:${ipTag(user.id)}` : ipTag(ip);

  // Rate-limit before spending an LLM call. A blocked request never reaches
  // OpenRouter, so 429s are cheap.
  const rl = await rateLimit(rlKey);
  if (!rl.ok) {
    logLine({ ev: "429", ip: tag, tier: rl.tier, backend: rl.backend });
    const message =
      rl.tier === "daily"
        ? "You've reached today's practice limit with Ada. Come back tomorrow — or plug in your own OpenRouter key to keep going."
        : "One moment — you're going a little fast for Ada. Try again in a few seconds.";
    return Response.json({ error: message }, { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } });
  }
  logLine({ ev: "req", ip: tag, model: OPENROUTER_MODEL, backend: rl.backend, remaining: rl.remaining, auth: user ? 1 : 0 });

  // Persist the incoming turn for signed-in users. Best-effort: a DB problem must
  // never stop the learner getting an answer.
  let conversationId: string | null = null;
  if (user && problemSlug) {
    try {
      conversationId = await ensureConversation(user.id, problemSlug);
      const latest = messages[messages.length - 1];
      if (latest?.role === "user") await appendMessage(conversationId, "user", latest.content);
    } catch (err) {
      conversationId = null;
      logLine({ ev: "persist_err", ip: tag, msg: err instanceof Error ? err.message : "unknown" });
    }
  }

  try {
    // Pre-stream failures (bad key, tool-retry exhausted, network) surface here as
    // a clean JSON 500. Once the stream is live, mid-flight errors ride the SSE
    // channel as {type:"error"} instead — headers are already sent by then.
    const upstream = await connectOpenRouter(systemPrompt(context), messages);
    return new Response(
      envelopeStream(upstream, { ipTag: tag, model: OPENROUTER_MODEL, startedAt, conversationId }),
      { headers: SSE_HEADERS },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong reaching Ada.";
    logLine({ ev: "err", ip: tag, ms: Date.now() - startedAt, msg: message });
    return Response.json({ error: message }, { status: 500 });
  }
}
