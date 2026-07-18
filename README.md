<div align="center">

# Stepwise

**Watch algorithms run, then ask the tutor why — and she'll rewind the animation to show you.**

[**Live demo**](https://stepwise-beta.vercel.app) · [Report a bug](https://github.com/yashjaiswal2818/stepwise/issues) · [Contribute](CONTRIBUTING.md)

<!-- ⚠️ BEFORE LAUNCH: record the demo GIF and uncomment the line below.
     This is the single highest-leverage asset in the repo — people decide in ~3 seconds,
     and a wall of text loses most of them.

     Record ~10 seconds: open a problem → ask Ada "why did we move the pointer there?"
     → show the canvas jump to that exact step. That one interaction IS the pitch.
     Save it as docs/demo.gif, then uncomment:

![Stepwise — an algorithm visualizer with an AI tutor that drives the canvas](docs/demo.gif)
-->

*(Demo GIF coming — try the [live demo](https://stepwise-beta.vercel.app) in the meantime.)*

</div>

---

## What makes it different

Most algorithm visualizers show you an animation. Stepwise adds a tutor — **Ada** — who can *control* it.

Ask "why did we move the pointer there?" and she doesn't just explain in prose: she jumps the canvas to the exact step she's talking about, switches to a worst-case dataset, or re-runs the algorithm on input you invent. She answers in the context of what's on your screen right now — the current step, the live variables, the data structure you're looking at.

She's also deliberately **Socratic**. Ask her to just give you the answer and she won't. She'll ask what you've tried, point at the thing on screen that contradicts your assumption, and give one hint at a time — because the learner's own thinking is the product. (She *will* happily explain the current step, define a term, or give you a foothold if you're genuinely lost — withholding the answer isn't the same as withholding help.)

## Features

- **16 problems** across arrays, hash tables, stacks, queues, linked lists, trees, graphs, and recursion
- **8 structure-specific visualizations** — a linked list renders as nodes and arrows, a tree as a real tree, not generic bars
- **Step-by-step playback** with play/pause/scrub, synced code highlighting, a narration line, and a live variable watch panel
- **Custom input** — run any algorithm on your own array or string and watch it play out
- **An AI tutor that drives the canvas** via typed tool calls (jump to step, play/pause, switch dataset, re-run on new input)
- **Sign in with GitHub** to keep your conversations and sync solved problems + streaks across devices — entirely optional, everything works signed out

## Quick start

You only need one API key to run the whole thing locally. The database and auth are optional.

```bash
git clone https://github.com/yashjaiswal2818/stepwise.git
cd stepwise
pnpm install

cp .env.local.example .env.local
# add OPENROUTER_API_KEY — free models work; get one at https://openrouter.ai/keys

pnpm dev
```

Open [localhost:3000](http://localhost:3000). That's it — the visualizer and the tutor both work.

> **Want sign-in and saved conversations too?** Add a Neon `DATABASE_URL` plus the Better Auth / GitHub OAuth vars from `.env.local.example`, then run `pnpm db:migrate`. Skip it and the app runs fine without an account.

## Tech stack

| | |
|---|---|
| **Framework** | Next.js 16 (App Router), React 19, TypeScript |
| **Styling / motion** | Tailwind CSS v4, `motion` |
| **State** | Zustand |
| **Visualization** | Hand-rolled SVG renderers; d3-hierarchy for tree layout math |
| **AI** | OpenRouter (any tool-capable model), streamed over SSE |
| **Database** | Neon Postgres + Drizzle ORM |
| **Auth** | Better Auth (GitHub OAuth) |
| **Rate limiting** | Upstash Redis |

## How it works

The interesting design decision is **how the tutor talks to the visualization**.

Algorithm traces aren't stored data — each problem is a hand-written *tracer* that re-runs the real algorithm and commits an immutable snapshot at every meaningful step (`src/algorithms/`). That produces a `Trace`: an ordered list of steps, each with a complete scene, a narration line, the source lines to highlight, and the variables in scope.

The tutor never draws anything. It receives the current step index and scene as context, and when it wants to show you something it emits a **tool call referencing a step index** — the frontend owns every pixel. That's what keeps it reliable instead of a hallucination machine: the model chooses *which moment to show*, not *what to render*.

Text and tool calls stream back over one typed SSE channel, so prose appears token-by-token and the canvas moves the instant the tool block completes.

## Contributing

Contributions are very welcome — especially **new problems**. See [CONTRIBUTING.md](CONTRIBUTING.md) for the setup and a walkthrough of adding one.

Good first issues are labeled [`good first issue`](https://github.com/yashjaiswal2818/stepwise/labels/good%20first%20issue).

## License

[MIT](LICENSE) © Yash Jaiswal

---

<div align="center">

If Stepwise helped something click, a ⭐ genuinely helps others find it.

</div>
