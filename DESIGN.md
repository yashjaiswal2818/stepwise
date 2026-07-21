# Design

The visual system for Stepwise. Source of record: `app/globals.css`. If this file and that file disagree, the CSS wins and this file is the bug.

## Theme

**Instrument.** A precision measuring device, not a dashboard and not a terminal. Reference points: an oscilloscope face, a circuit schematic, a well-set textbook figure — but alive and running.

Dark-first, and the reason is concrete rather than aesthetic: the physical scene is a learner alone at 11pm, on a laptop, on their third attempt at a problem they have already failed. The interface should feel exact and trustworthy, not cheerful.

Theme switches by setting `data-theme="light"` on `<html>`. **The Tailwind `dark:` variant does not work in this project** — no `@custom-variant` is declared, and theming is token indirection only. Every token has a value in both blocks.

## The governing rule

> **Color means algorithm state. Nothing else on screen is saturated.**

Chrome is a cool near-neutral. Primary actions are high-contrast ink-on-paper, not a brand hue. So the seven state colors are the only chromatic things a learner ever sees, and chroma always carries information.

Three consequences that resolve most day-to-day decisions:

- **There is no brand color.** If you want emphasis, use weight, size, or elevation.
- **Selection and active states are elevation + a marker rule**, never a colored fill. A selected tab is `bg-surface-3` + a 2px `--marker` rule + `font-medium` — not a tinted pill.

  **Why the marker exists.** Measured from the OKLCH values: `--surface-3` over `--surface` is **1.31:1** dark / **1.19:1** light, and `--border-strong` over `--surface-3` is **1.38:1** / **1.35:1**. WCAG 1.4.11 wants **3:1** for anything that identifies a component's state, so elevation and border weight *cannot carry a selected state on their own* — they read as texture, not signal. Raising `--border-strong` to clear it would need L≥0.585 dark, making every border in the app heavier; that is the wrong trade. Hence `--marker`: a dedicated achromatic 2px rule at **11.63:1** on `--surface-3`, which never competes with state encoding. Elevation does the aesthetic work; the marker does the accessibility work.
- **Decorative gradients, glows, and tints are deleted, not restyled.** There is no "subtler version" to fall back to.

## Color

All values OKLCH. A single cool hue (258) at very low chroma carries the chrome — deliberately not neutral grey, because the faint blue cast makes the state colors read as warmer by contrast.

### Chrome

| Token | Dark | Light | Role |
|---|---|---|---|
| `--bg` | `oklch(0.165 0.012 258)` | `oklch(0.985 0.003 258)` | page |
| `--bg-elevated` | `oklch(0.205 0.013 258)` | `oklch(1.000 0.000 258)` | raised region |
| `--surface` | `oklch(0.235 0.014 258)` | `oklch(1.000 0.000 258)` | cards, panels |
| `--surface-2` | `oklch(0.275 0.015 258)` | `oklch(0.968 0.004 258)` | inset, hover |
| `--surface-3` | `oklch(0.320 0.016 258)` | `oklch(0.940 0.005 258)` | **selected / active** |
| `--border` | `oklch(0.300 0.014 258)` | `oklch(0.910 0.005 258)` | hairlines |
| `--border-strong` | `oklch(0.400 0.016 258)` | `oklch(0.845 0.008 258)` | emphasis, selection edge |

### Foreground

Two body-text levels, both ≥4.5:1 on **every** surface in **both** themes.

| Token | Dark on `--bg` | on `--surface-3` | Use |
|---|---|---|---|
| `--text` | 17.15:1 | 11.29:1 | prose, headings, values |
| `--text-muted` | 8.98:1 | 5.91:1 | labels, secondary prose |
| `--text-faint` | 6.08:1 | **4.00:1** | **decorative only** |

**`--text-faint` is not a body-text token.** It clears 3:1 but not 4.5:1 on `--surface-3`, so it is for non-essential marks — tick labels, unit suffixes, axis numbers that are never the only route to the information. Real prose uses `--text-muted`. Making it pass 4.5:1 everywhere would collapse it into `--text-muted` and leave two levels wearing three names.

### Action

There is no brand hue. Primary actions are paper-on-ink (dark theme) or ink-on-paper (light).

`--accent` · `--accent-fg` · `--ring` — the focus ring measures **17.67:1 on `--bg`** and **11.63:1 on `--surface-3`**.

### Algorithm state — the load-bearing palette

**These values were solved, not picked.** `scripts/palette-solver.mjs` searches luminance, chroma and hue per state against five simultaneous constraints: sRGB gamut, ≥3:1 stroke contrast on surface, ≥4.5:1 for ink on the fill, a luminance ordering matching semantic prominence, and pairwise separation under deuteranopia, protanopia and tritanopia. **Re-run the solver before changing any value.**

| State | Dark | Light | Meaning |
|---|---|---|---|
| `active` | `#fed940` | `#be8b00` | examined right now |
| `final` | `#64d579` | `#107f3c` | locked in / the answer |
| `frontier` | `#fe8844` | `#8f3001` | queued to explore next |
| `path` | `#cd87ae` | `#cd6485` | on the path or cycle |
| `compare` | `#2e94f1` | `#005e9a` | compared against active |
| `swap` | `#8a6dba` | `#8670c0` | mid-move |
| `visited` | `#678d8c` | `#274b4c` | already explored |

Three properties are deliberate and must survive any edit:

1. **Prominence is encoded in luminance.** `active` dominates; `visited` is a near-neutral because it has finished being interesting. Visual hierarchy matches conceptual hierarchy.
2. **`visited` is chromatically near-neutral on purpose.** Reading as grey both makes it recede *and* removes it from color-vision contention, which is what made seven distinguishable categories solvable at all.
3. **Hue is never the only channel.** Every pair separates by luminance as well, so the encoding survives all three color-vision deficiencies.

Read state colors through `stateColor()` in `src/design-system/state-palette.ts`. Never inline a hex.

**Fills differ by theme, and `.state-fill` handles it in one place.** Dark: the saturated color is the fill and `--state-ink` sits on it. Light: a saturated fill would blow out with nothing legible on top, so the fill becomes a 16% tint of the surface and the saturated color carries the stroke and label instead. `--state-fill-mix` is the switch.

### Code syntax

Deliberately **low chroma**. The code panel sits beside the canvas; if syntax highlighting competes with state encoding, the learner's eye goes to the wrong place. Do not raise these.

## Typography

**Archivo** (UI, display) + **JetBrains Mono** (all numerics and code). Paired on a real contrast axis — grotesque against monospace — not two similar sans faces. Archivo is a grotesque drawn for small sizes with unambiguous digits; it replaces the create-next-app Geist default, which is the single most recognisable scaffold tell.

**Numerals are data.** Indices, addresses, complexities, step counters and watch values are all mono, tabular, with a slashed zero. Prose is sans.

### Scale

Fixed rem steps, not fluid — this is product UI at consistent DPI, and a heading that shrinks inside a split pane looks worse, not better. The ratio widens as it climbs (~1.08 at the dense end, ~1.25 at the display end) because small sizes need finer control than large ones.

| Token | px | Use |
|---|---|---|
| `text-2xs` | 11 | tick labels, addresses, legend |
| `text-xs` | 12 | metadata, chips, captions |
| `text-sm` | 13 | dense UI labels, table cells |
| `text-base` | 14 | default UI text, buttons |
| `text-md` | 16 | prose, narration |
| `text-lg` | 20 | panel and section headings |
| `text-xl` | 26 | page titles |
| `text-2xl` | 34 | section display |
| `text-3xl` | 44 | hero only |

**Line-height and letter-spacing are bound to every step**, so you cannot take a size without its tracking. **Arbitrary bracket values are forbidden** — `text-[12.5px]` is a bug report about a missing step, not a solution. If you need a size that is not here, add a step.

Note `text-base` is 14px and `text-md` is 16px: "default UI text" and "prose" are different jobs.

Prose caps at 65–75ch. Display headings use `text-wrap: balance`; long prose uses `text-wrap: pretty`.

## Radius

**A function of control height, not a constant.** A 28px chip and a 480px panel sharing one radius is the most recognisable templated tell there is. Tighter than Tailwind stock throughout — Instrument is precise, not soft.

`--radius-xs` 3px (kbd, tick marks, inline code) · `--radius-sm` 5px (badges, inputs, h-8) · `--radius-md` 7px (h-10 buttons, canvas cells) · `--radius-lg` 10px (cards, panels) · `--radius-xl` 14px (modals, sheets) · `--radius-2xl` 20px (the hero frame, and nothing else)

## Elevation

**Hairlines and inset highlights, not soft drop shadows.**

`--lift` / `--lift-hi` are the primary elevation signal: a 1px top highlight that reads as a bevel catching light. Shadows exist only for genuinely floating layers — `--shadow-pop` (popover, dropdown, tooltip) and `--shadow-modal` (dialog, sheet).

A card gets a border and `--lift`. It does not get a drop shadow.

The old universal `* { border-color }` rule is gone. Borders are set explicitly, so border color can carry meaning again.

## Motion

Tokens are the only durations and curves. **A literal `cubic-bezier` or a raw `duration-200` inside a component is a defect** — read the token.

`--duration-fast` 120ms (hover, press, focus) · `--duration-base` 200ms (most state transitions) · `--duration-step` 320ms (one algorithm step) · `--duration-slow` 460ms (panel and layout changes)

`--ease-out` (ease-out-quint) · `--ease-in-out` · `--ease-step`

Rules: motion conveys state, never decoration. **One logical step per animation** — never animate two conceptual changes at once. No bounce, no elastic, no spring overshoot on product UI. No orchestrated page-load sequence: users load into a task. `prefers-reduced-motion` is honored globally, and the reduced path must still render content — never gate visibility on a transition that will not fire.

**Derive the motion choice from what the structure means.** `ArrayView` makes layout a pure function of index, so swaps slide. `ListView` freezes positions and animates only links, so reversal reads as *rewiring* rather than *rearranging*. Both are correct; neither would be correct for the other structure.

## Components

Primitives live in `src/design-system/ui/`. **Reuse them.** Hand-rolling `rounded-lg border border-line bg-surface` inline is how the system stops being a system.

Every interactive component ships **all** of: default, hover, focus-visible, active, disabled, loading, error. Half a set is not done.

Empty, loading, and error states are designed before the happy path. Empty states teach the interface rather than announcing emptiness.

**shadcn is used for behavior only** — Dialog, Popover, Command, Tooltip, Dropdown, Tabs, Sheet, Toast — because focus traps, portals and a11y are genuinely hard. Every one is restyled against these tokens before it ships. If a component still looks like stock shadcn, it has not shipped. Never adopt shadcn's token names.

## Canvas

The eight SVG renderers in `src/engine/canvas/renderers/` are the product. `ListView.tsx` is the quality bar; read it before touching any of them.

**Known trap:** every renderer uses `preserveAspectRatio="xMidYMid meet"`, so `fontSize` is in **viewBox units** — text physically grows when the splitter is dragged. There are 13 distinct sizes across the 8 renderers with no scale. Establish a scale or an HTML overlay layer before treating canvas typography as fixable by nudging numbers.

## The bans

Match and refuse. If you are about to write one of these, rewrite the element.

Gradient text · a brand hue of any kind, especially purple/indigo/violet · soft drop shadows as the default elevation language · one radius across all element sizes · identical icon-title-body card grids · centered hero with twin filled+outline CTAs · tiny uppercase tracked eyebrows above every section · numbered section markers (01/02/03) as scaffolding · emoji as iconography · `Sparkles` icons · "Powered by AI" pills · glassmorphism as decoration · bounce or elastic easing · arbitrary bracket type sizes · `dark:` utilities · color used for anything but algorithm state · **any UI that depicts the product instead of being it**.
