# Contributing to Stepwise

Thanks for being here. The most useful contribution is usually **a new problem** — that's what grows the library — but bug fixes, visual polish, and better tutor prompts are all welcome.

## Setup

You only need one API key. The database and auth are optional for local development.

```bash
pnpm install
cp .env.local.example .env.local
# add OPENROUTER_API_KEY (free models work — https://openrouter.ai/keys)
pnpm dev
```

Before opening a PR:

```bash
pnpm lint
npx tsc --noEmit
pnpm build
```

## Adding a new problem

This is the highest-value contribution and a genuinely good first issue. Budget an hour for your first one.

The key idea: **traces are generated, not stored.** You don't hand-write JSON of every step. You write a small re-implementation of the algorithm instrumented with a *tracer*, and the app runs it to produce the steps. That's what lets the same algorithm re-run on arbitrary user input.

### 1. Write the tracer

Create `src/algorithms/<category>/<name>.ts`. The clearest model to copy is [`src/algorithms/sorting/bubble.ts`](src/algorithms/sorting/bubble.ts). It has three parts:

```ts
// (a) The code shown in the UI. This is an inert STRING — it is never executed.
export const SOURCE = `function bubbleSort(a) { ... }`;

// (b) Line anchors into that string, 1-based. Keep these in sync by hand when
//     you edit SOURCE — they drive the code-panel highlighting.
const L = { func: 1, outer: 2, inner: 3, compare: 4, swap: 5, ret: 10 } as const;

// (c) The real algorithm, instrumented. Each semantic call commits a snapshot.
export function bubbleSortTrace(values: number[], datasetId = "default"): Trace {
  const t = new ArrayTracer(values);
  // ...real logic, using t.compare(), t.swap(), t.setPointer(), t.markFinal()...
  return t.build({ exampleId: "bubble-sort", title: "Bubble Sort", code: SOURCE, datasetId });
}
```

Pick the tracer matching your data structure from `src/algorithms/authoring/`:

`ArrayTracer` · `ListTracer` · `StackTracer` · `QueueTracer` · `HashTracer` · `TreeTracer` · `GraphTracer` · `GridTracer`

**Aim for one logical change per step.** A step that moves a pointer *and* swaps two elements is two steps. The narration should read like a sentence a tutor would say.

### 2. Register it

Your problem needs entries in a few places (all small):

| File | What to add |
|---|---|
| `src/algorithms/registry.ts` | `REGISTRY` entry: `{ id, build, datasets }` — 2–4 curated datasets, ideally including a best and worst case |
| `src/curriculum/catalog.ts` | `PROBLEMS` metadata: `slug`, `title`, `topic`, `difficulty`, `tier`, `structure` |
| `src/curriculum/lessons.ts` | Time/space complexity and the one-line core idea |
| `src/components/shell/ProblemWorkspace.tsx` | A short problem description (`DESCRIPTIONS`) |

Optional but nice:

| File | What it adds |
|---|---|
| `src/algorithms/custom.ts` | Lets learners run your algorithm on their own input |
| `src/curriculum/constellation.ts` | Places the problem on the `/learn` map |
| `src/curriculum/structures.ts` | Links it from the structure landing page |

The **slug is the identity** across the whole app — progress, deep links, and the tutor all key off it. There is no problems table in the database; metadata lives in `catalog.ts`.

### Shortcut: generate the tracer

There's a generator that writes the tracer for you and proves it runs:

```bash
pnpm add-problem "Merge Intervals" --structure array
# --structure: array | list | stack | queue | hash | tree | graph | grid
# optional:    --slug merge-intervals   --dir arrays
```

It sends the engine contract, the tracer API, and a gold-standard example to a
model, writes the result, then **imports and executes it** — checking the trace
against the same invariants the whole catalog is held to. Validation failures are
fed back for up to 3 attempts, and anything still broken is deleted rather than
left in your tree. It prints the registration snippets when it succeeds.

Set `ADD_PROBLEM_MODEL` to a stronger model than the default for better
first-pass results.

**It deliberately does not register the problem for you, and its output is a
draft, not a finished contribution.** In testing, generated tracers ran and
passed every mechanical check while still containing a line anchor pointing at
the wrong statement, and an API call that technically worked but misrepresented
what was happening. Both are invisible to any automated check and obvious to a
human reading it. Review before you register.

### 3. Check your work

Whatever you generate or hand-write, run:

```bash
pnpm validate:traces              # every problem × every dataset
pnpm validate:traces <your-slug>  # just yours
```

This executes each trace and checks step ordering, non-empty narration, and — the
one that rots silently — that every `codeLines` anchor still points inside
`SOURCE`. It's wired to exit non-zero, so it works as a CI gate.

Then run it at `/problem/<your-slug>` and step all the way through:

- Does every step highlight the right source line?
- Does the narration read like a human explaining, not a log line?
- Does the final state actually solve the problem?
- Try a custom input and an edge case (empty array, single element, duplicates).
- Ask Ada a question about it — does she have enough context to answer well?

There's also a step inspector at `/dev/trace/<your-slug>` that dumps the raw trace as a table.

> **Why the review bar is high here:** a subtly wrong visualization teaches a wrong mental model, which is worse than no visualization. Expect review comments on the *pedagogy*, not just the code.

## Other contributions

- **Bug fixes** — please include repro steps.
- **Visual/UX polish** — screenshots before/after are very persuasive.
- **Tutor prompt improvements** — the system prompt lives in `app/api/tutor/route.ts`. If you change it, say which learner questions you tested against; it's tuned to withhold answers without being unhelpful, and that balance is easy to break.

## Pull requests

- Branch off `main`, keep PRs focused on one thing.
- Describe *what a user sees differently* after your change.
- Make sure `pnpm lint`, `tsc --noEmit`, and `pnpm build` all pass.

## Code of conduct

By participating you agree to uphold the [Code of Conduct](CODE_OF_CONDUCT.md).
