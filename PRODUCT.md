# Product

## Register

product

The workspace at `/problem/[slug]` is the primary surface and sets the register — a learner is in a task, and the design serves it. The landing page at `/` is a deliberate brand exception: it has one job, which is to make a stranger understand what this is in five seconds. Everything else (`/learn`, `/problems`, account surfaces) follows the product register.

## Users

Self-taught developers and CS students preparing for technical interviews, usually working alone, often late at night, often on their second or third attempt at a problem they have already failed.

Their context matters more than their demographics: they arrive **frustrated**. They have already read an editorial that explained *what* the algorithm does without making them understand *why* it works. They can recite that two-pointers is O(n) and still not see why the pointers can safely never move backward.

The job to be done is not "solve this problem." It is **"make the mechanism click, so I never need to memorize this one again."**

A secondary user matters for the project's other goal: an engineer evaluating the maintainer's work — reading the repo, clicking the demo, deciding in about thirty seconds whether this person builds real things.

## Product Purpose

Stepwise runs algorithms **for real** and draws every step, so a learner can pause, scrub backward, change the input, and watch the mechanism instead of reading about it. An AI tutor, Ada, sits alongside the visualization and is wired to it — she can jump the learner to a specific step and point at what is on screen.

Ada's defining constraint is that she **will not simply hand over the answer**. She diagnoses where the learner is stuck and nudges one step. That refusal is the product; without it this is a fancy button.

Success looks like: a learner who arrived stuck leaves able to explain the idea in their own words, and comes back for the next problem.

## Brand Personality

**Precise. Patient. Unshowy.**

The voice of a good TA at a whiteboard at 11pm — someone who has explained this fifty times, is not bored of it, and will not do your homework for you. Confident enough to say "not yet" and mean it kindly.

Emotionally the interface should feel like a **trustworthy instrument**: calm, exact, legible, and slightly serious. Not cheerful, not gamified, not congratulatory. The satisfaction on offer is comprehension, not confetti.

## Anti-references

- **Anything that reads as AI-generated.** This is the explicit brief. Concretely: gradient headline text, purple-to-violet brand, centered hero with twin filled+outline CTAs, three identical icon-title-body feature cards, `Sparkles` icons, "✨ Powered by AI" pills, create-next-app default fonts, soft-shadowed rounded cards everywhere.
- **Stock shadcn.** Used here for behavior only (focus traps, portals, a11y). If a component still *looks* like shadcn, it has not shipped.
- **Gamified learning apps.** No streak-shaming, no confetti, no mascot, no XP bar as the primary motivator. Streaks may exist as information; they are never the point.
- **LeetCode's UI.** Dense, cluttered, joyless.
- **Classic academic visualizers.** Correct, ugly, and abandoned in 2011.
- **Depicting the product instead of being it.** Fake screenshots, mock transport bars, hardcoded progress. If the hero shows a visualization, it must be the real one, really running.

## Design Principles

1. **Show the mechanism, don't assert it.** A visualization earns its place by teaching something the narration cannot say in words. `ListView` renders each node's memory address so a learner can physically trace a pointer to its target — that is the bar. A picture that merely illustrates a sentence is decoration.

2. **Color means algorithm state.** Chroma is the scarcest resource in this interface and it is spent entirely on state encoding. Chrome is near-neutral; primary actions use contrast, not hue. If something is colored, it is telling you something about the algorithm.

3. **Be the product, don't depict it.** Every surface shows real, running output. This rules out mock data, fake controls, and illustrative screenshots — including in marketing.

4. **Productive struggle over answers.** The tutor withholds by design, and the interface should not undo that by making the answer easy to stumble into. But a learner who is *lost* rather than *stuck* gets real help; obstruction is a failure mode too.

5. **Withdraw what has become false.** When a rewiring means the first node is no longer the head, the "head" label is removed — not left lying. State that has gone stale is worse than state never shown.

## Accessibility & Inclusion

- **WCAG 2.2 AA, verified numerically, in both themes.** Body text ≥4.5:1, large text ≥3:1, graphical objects and focus indicators ≥3:1. Contrast is computed, never eyeballed. The light theme's canvas is held to the same standard as the dark one.
- **The state palette is the a11y-critical surface**, because it is the layer users look at for most of the session. It must survive grayscale and must be checked against deuteranopia, protanopia, and tritanopia — the state colors are tiered by luminance so that hue is never the only channel carrying meaning.
- **Keyboard-complete.** Every interactive element reachable, with a visible focus indicator. No component strips the focus ring without replacing it.
- **`prefers-reduced-motion` is honored everywhere**, and the reduced path still renders content — visibility is never gated on a transition that will not fire.
- Beginners are the default audience, so jargon is earned before it is used.

---

*Drafted from a full codebase audit plus the maintainer's stated direction. Review and correct anything that misreads the intent — every other design document and agent in this repo reads this file.*
