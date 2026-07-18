/**
 * Generate a new problem's tracer, then prove it actually runs.
 *
 *   pnpm add-problem "Merge Intervals" --structure array
 *   pnpm add-problem "Trie Insert" --structure tree --slug trie-insert --dir trees
 *
 * Why this generates a TRACER and not JSON: traces aren't stored data. Each
 * problem is a real re-implementation of the algorithm instrumented with a
 * tracer, which is what lets the app re-run it on arbitrary learner input. The
 * authoring cost is the tracer + the inert SOURCE string + the hand-maintained
 * line-anchor map — so that is what gets generated.
 *
 * The validation is the point. A generated tracer is imported and EXECUTED, and
 * the resulting trace is checked against the same invariants the whole catalog
 * is held to. A schema can't tell you the algorithm is wrong; running it can.
 * Failures are fed back for a retry, and anything still broken is deleted rather
 * than left in your source tree.
 *
 * It never registers the problem for you. Generated steps can be plausible and
 * subtly wrong, and a wrong visualization teaches a wrong mental model — so a
 * human reviews and wires it up.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { pathToFileURL } from "node:url";
import { config } from "dotenv";
import { checkTrace } from "./lib/trace-checks";
import type { Trace } from "../src/engine/types";

config({ path: ".env.local", quiet: true });

const MAX_ATTEMPTS = 3;

const TRACERS: Record<string, { file: string; sample: (number | string)[]; sampleArg: number }> = {
  array: { file: "ArrayTracer", sample: [5, 1, 4, 2, 8], sampleArg: 4 },
  list: { file: "ListTracer", sample: [1, 2, 3, 4], sampleArg: 3 },
  stack: { file: "StackTracer", sample: ["(", "[", "]", ")"], sampleArg: 0 },
  queue: { file: "QueueTracer", sample: [1, 2, 3], sampleArg: 0 },
  hash: { file: "HashTracer", sample: [2, 7, 11, 15], sampleArg: 9 },
  tree: { file: "TreeTracer", sample: [5, 3, 8, 1, 4], sampleArg: 4 },
  graph: { file: "GraphTracer", sample: [1, 2, 3, 4, 5], sampleArg: 0 },
  grid: { file: "GridTracer", sample: [1, 1, 0, 0, 1], sampleArg: 0 },
};

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i > -1 ? process.argv[i + 1] : undefined;
}

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const camel = (slug: string) =>
  slug.split("-").map((w, i) => (i ? w[0].toUpperCase() + w.slice(1) : w)).join("");

function buildPrompt(title: string, slug: string, structure: string, tracerFile: string): string {
  const read = (p: string) => readFileSync(resolve(p), "utf8");
  const types = read("src/engine/types.ts");
  const tracerApi = read(`src/algorithms/authoring/${tracerFile}.ts`);
  const example = read("src/algorithms/sorting/bubble.ts");

  return `You are writing ONE TypeScript file for an algorithm-visualization app. It records an algorithm as a sequence of visual steps a beginner can follow.

## The engine contract (read-only, for reference)
\`\`\`ts
${types}
\`\`\`

## The tracer API you must use (read-only)
\`\`\`ts
${tracerApi}
\`\`\`

## A gold-standard example — match this structure exactly
\`\`\`ts
${example}
\`\`\`

## Your task
Write the equivalent file for: **${title}** (slug: \`${slug}\`, structure: ${structure}).

Requirements, all mandatory:
1. Export \`const SOURCE\` — the reference implementation shown in the UI's code panel. It is an inert STRING and is never executed. Keep it short and readable (a beginner reads this).
2. Export nothing else at module scope except the trace function and SOURCE.
3. Define \`const L = { ... } as const\` — 1-based line anchors INTO \`SOURCE\`. Every value MUST be a real line number of SOURCE. Count the lines carefully; an anchor past the end of SOURCE is a hard failure.
4. Export the trace function, named \`${camel(slug)}Trace\`, using ONE of these two signatures:
   - Default: \`export function ${camel(slug)}Trace(values: (number | string)[], datasetId = "default"): Trace\`
   - **If the algorithm needs a scalar argument** (a search target, a target sum, k, etc.):
     \`export function ${camel(slug)}Trace(values: number[], target: number, datasetId = "default"): Trace\`
   The repo passes that scalar from \`Dataset.arg\` (e.g. \`binarySearchTrace(nums(ds), ds.arg ?? 0, ds.id)\`).
   **Never smuggle the target inside \`values\`** — every element of \`values\` is rendered as a visible
   cell, so hiding a target in there would draw it as part of the data being searched. That is a bug.
5. Inside, run the REAL algorithm using \`${tracerFile}\`'s semantic methods. Do not fabricate steps; each snapshot must come from actually executing the logic.
6. **One logical change per step.** Moving a pointer and swapping are two steps, not one.
7. Every step needs narration that reads like a tutor talking ("Compare 4 and 8 — 4 is smaller, so the window shrinks"), not a log line ("i=2").
8. Pass \`exampleId: "${slug}"\` and \`title: "${title}"\` to \`t.build\`.
9. Import types from \`@/engine/types\` and the tracer from \`../authoring/${tracerFile}\`.
10. Do NOT include the optional \`sources\` (py/c) block — that gets added by hand later.

Return ONLY the file contents. No prose, no explanation, no markdown fences.`;
}

async function generate(prompt: string, model: string, priorErrors?: string[]): Promise<string> {
  const messages: { role: string; content: string }[] = [{ role: "user", content: prompt }];
  if (priorErrors?.length) {
    messages.push({
      role: "user",
      content: `Your previous attempt FAILED validation when executed:\n\n${priorErrors
        .map((e) => `- ${e}`)
        .join("\n")}\n\nFix these specific problems and return the corrected file. Return ONLY the file contents.`,
    });
  }

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "X-Title": "Stepwise add-problem",
    },
    body: JSON.stringify({ model, max_tokens: 4000, temperature: 0.2, messages }),
  });

  if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  const text: string = data.choices?.[0]?.message?.content ?? "";
  if (!text.trim()) throw new Error("Model returned an empty response.");

  // Strip markdown fences if the model added them despite instructions.
  return text.replace(/^```(?:ts|typescript)?\n?/gm, "").replace(/```\s*$/gm, "").trim() + "\n";
}

/** Import the generated file and run it — the check a schema can't do. */
async function validateFile(
  file: string,
  sample: (number | string)[],
  sampleArg: number,
  attempt: number,
): Promise<string[]> {
  let mod: Record<string, unknown>;
  try {
    mod = (await import(`${pathToFileURL(resolve(file)).href}?v=${attempt}`)) as Record<string, unknown>;
  } catch (err) {
    return [`file does not load: ${err instanceof Error ? err.message : String(err)}`];
  }

  const entry = Object.entries(mod).find(
    ([k, v]) => typeof v === "function" && k.endsWith("Trace"),
  );
  if (!entry) return ["no exported function ending in `Trace` was found"];

  // Support both conventions: (values, datasetId) and (values, target, datasetId).
  const fn = entry[1] as (...args: unknown[]) => Trace;
  const takesScalar = fn.length >= 3;

  let trace: Trace;
  try {
    trace = takesScalar ? fn(sample, sampleArg, "default") : fn(sample, "default");
  } catch (err) {
    return [`threw while building the trace: ${err instanceof Error ? err.message : String(err)}`];
  }

  return checkTrace(trace);
}

async function main(): Promise<void> {
  const title = process.argv[2];
  const structure = arg("--structure") ?? "array";
  const slug = arg("--slug") ?? slugify(title ?? "");
  const tracer = TRACERS[structure];

  if (!title || title.startsWith("--")) {
    console.error('Usage: pnpm add-problem "Merge Intervals" --structure array [--slug ...] [--dir ...]');
    console.error(`       --structure one of: ${Object.keys(TRACERS).join(", ")}`);
    process.exit(1);
  }
  if (!tracer) {
    console.error(`Unknown --structure "${structure}". Options: ${Object.keys(TRACERS).join(", ")}`);
    process.exit(1);
  }
  if (!process.env.OPENROUTER_API_KEY) {
    console.error("OPENROUTER_API_KEY is not set (see .env.local.example).");
    process.exit(1);
  }

  const dir = arg("--dir") ?? structure;
  const file = `src/algorithms/${dir}/${slug}.ts`;
  if (existsSync(resolve(file))) {
    console.error(`${file} already exists — pick a different --slug or delete it first.`);
    process.exit(1);
  }

  const model = process.env.ADD_PROBLEM_MODEL || process.env.OPENROUTER_MODEL || "tencent/hy3:free";
  console.log(`Generating "${title}" → ${file}`);
  console.log(`  structure: ${structure} (${tracer.file})   model: ${model}`);
  if (model.endsWith(":free")) {
    console.log("  note: free models often struggle with this. Set ADD_PROBLEM_MODEL to a stronger one for better first-pass results.\n");
  }

  const prompt = buildPrompt(title, slug, structure, tracer.file);
  mkdirSync(dirname(resolve(file)), { recursive: true });

  let errors: string[] = [];
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    console.log(`Attempt ${attempt}/${MAX_ATTEMPTS} — generating…`);
    let code: string;
    try {
      code = await generate(prompt, model, errors);
    } catch (err) {
      console.error(`  generation failed: ${err instanceof Error ? err.message : String(err)}`);
      break;
    }

    writeFileSync(resolve(file), code);
    console.log("  validating by executing the trace…");
    errors = await validateFile(file, tracer.sample, tracer.sampleArg, attempt);

    if (!errors.length) {
      console.log(`\n✓ Valid trace. Written to ${file}\n`);
      printNextSteps(title, slug, dir, tracer.file);
      return;
    }

    console.log(`  ✗ ${errors.length} problem(s):`);
    for (const e of errors.slice(0, 6)) console.log(`      ${e}`);
    if (errors.length > 6) console.log(`      …and ${errors.length - 6} more`);
    if (attempt < MAX_ATTEMPTS) console.log("  feeding errors back and retrying…\n");
  }

  if (existsSync(resolve(file))) unlinkSync(resolve(file));
  console.error(`\n✗ Gave up after ${MAX_ATTEMPTS} attempts. Removed ${file} rather than leave broken code behind.`);
  console.error("  Try a stronger ADD_PROBLEM_MODEL, or write this one by hand (see CONTRIBUTING.md).");
  process.exit(1);
}

function printNextSteps(title: string, slug: string, dir: string, tracerFile: string): void {
  console.log("The trace runs and satisfies every mechanical check — but it has NOT been");
  console.log("reviewed for correctness. Generated steps can be plausible and subtly wrong,");
  console.log("and a wrong visualization teaches a wrong mental model. Please:\n");
  console.log(`  1. Read src/algorithms/${dir}/${slug}.ts — does each step do one logical thing?`);
  console.log("  2. Register it (4 small edits):\n");
  console.log(`     src/algorithms/registry.ts`);
  console.log(`       import { ${camel(slug)}Trace } from "./${dir}/${slug}";`);
  console.log(`       "${slug}": {`);
  console.log(`         id: "${slug}",`);
  console.log(`         build: (ds) => ${camel(slug)}Trace(ds.values, ds.id),`);
  console.log(`         datasets: [{ id: "default", label: "Example", values: [/* ... */] }],`);
  console.log(`       },\n`);
  console.log(`     src/curriculum/catalog.ts`);
  console.log(`       { slug: "${slug}", title: "${title}", topic: "…", difficulty: "Easy", tier: 1, structure: "…" },\n`);
  console.log(`     src/curriculum/lessons.ts        → time/space complexity + the core idea`);
  console.log(`     src/components/shell/ProblemWorkspace.tsx → a one-line description\n`);
  console.log(`  3. Run it: pnpm dev → /problem/${slug}`);
  console.log(`  4. Re-check the whole catalog: pnpm validate:traces`);
  console.log(`  5. Open a PR — never commit a generated problem straight to main.`);
  console.log(`\n  (Tracer used: ${tracerFile}. Full guide: CONTRIBUTING.md)`);
}

main();
