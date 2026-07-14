import Anthropic from "@anthropic-ai/sdk";

// Needs Node APIs (Anthropic SDK / fetch with secrets) — pin to the Node runtime.
export const runtime = "nodejs";

// Provider is chosen by which key is present: OpenRouter (for testing) wins if set,
// otherwise Anthropic. Model ids are overridable via env.
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "tencent/hy3:free";

interface ToolDef {
  name: string;
  description: string;
  schema: Record<string, unknown>;
}

/** One neutral tool list, mapped to each provider's wire format below. */
const TOOLS: ToolDef[] = [
  {
    name: "goto_step",
    description:
      "Jump the visualization to a specific step (1-based, as shown in 'Step X / N'). Use it to point the learner at the exact moment you're explaining.",
    schema: {
      type: "object",
      properties: { step: { type: "integer", description: "1-based step number" } },
      required: ["step"],
    },
  },
  {
    name: "play",
    description: "Start automatic playback from the current step.",
    schema: { type: "object", properties: {} },
  },
  {
    name: "pause",
    description: "Pause playback.",
    schema: { type: "object", properties: {} },
  },
  {
    name: "set_dataset",
    description:
      "Switch to one of the curated datasets for this problem. Use the exact dataset id from the context (e.g. to show a best or worst case).",
    schema: {
      type: "object",
      properties: { dataset_id: { type: "string", description: "Exact curated dataset id" } },
      required: ["dataset_id"],
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
interface TutorResult {
  text: string;
  actions: { name: string; input: Record<string, unknown> }[];
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
    "You can control the visualization with tools. When the learner asks to see, run, jump to, play, pause, or try something, CALL the matching tool AND briefly say what you did in one sentence. Always include a short text reply alongside any tool call. Never reference a step or dataset that isn't in the context below.",
    "Keep replies under ~120 words unless the learner asks you to go deeper.",
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

// ---- OpenRouter (OpenAI-compatible) ----
async function runOpenRouter(system: string, messages: ChatMessage[], withTools = true): Promise<TutorResult> {
  const body: Record<string, unknown> = {
    model: OPENROUTER_MODEL,
    max_tokens: 900,
    temperature: 0.5,
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
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost",
      "X-Title": "Stepwise",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok || data.error) {
    const msg: string = data?.error?.message || `OpenRouter error ${res.status}`;
    // Free/small models may not support tool-calling — retry once as a plain chat.
    if (withTools && /tool|function/i.test(msg)) return runOpenRouter(system, messages, false);
    throw new Error(msg);
  }

  const choice = data.choices?.[0]?.message ?? {};
  const text: string = choice.content ?? "";
  const actions = (choice.tool_calls ?? []).map((tc: { function?: { name?: string; arguments?: string } }) => {
    let input: Record<string, unknown> = {};
    try {
      input = JSON.parse(tc.function?.arguments || "{}");
    } catch {
      /* ignore malformed tool args */
    }
    return { name: tc.function?.name ?? "", input };
  });
  return { text: text.trim(), actions };
}

// ---- Anthropic ----
async function runAnthropic(system: string, messages: ChatMessage[]): Promise<TutorResult> {
  const client = new Anthropic();
  const response = await client.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 900,
    system,
    tools: TOOLS.map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: t.schema as unknown as Anthropic.Tool["input_schema"],
    })),
    messages,
  });
  let text = "";
  const actions: TutorResult["actions"] = [];
  for (const block of response.content) {
    if (block.type === "text") text += block.text;
    else if (block.type === "tool_use") actions.push({ name: block.name, input: block.input as Record<string, unknown> });
  }
  return { text: text.trim(), actions };
}

export async function POST(req: Request) {
  const provider = process.env.OPENROUTER_API_KEY
    ? "openrouter"
    : process.env.ANTHROPIC_API_KEY
      ? "anthropic"
      : null;
  if (!provider) return Response.json({ needsKey: true });

  let body: { messages?: ChatMessage[]; context?: TutorContext };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  const { messages, context } = body;
  if (!messages?.length || !context) {
    return Response.json({ error: "Missing messages or context." }, { status: 400 });
  }

  try {
    const system = systemPrompt(context);
    const result =
      provider === "openrouter" ? await runOpenRouter(system, messages) : await runAnthropic(system, messages);
    return Response.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong reaching Ada.";
    return Response.json({ error: message }, { status: 500 });
  }
}
