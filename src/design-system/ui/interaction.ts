/**
 * Shared interaction states for the interactive primitives.
 *
 * These exist as one constant each because they had already drifted: Button and
 * IconButton disagreed on press depth (0.98 vs 0.95), disabled opacity (50 vs
 * 40) and transition timing (a token duration vs Tailwind's untokened 150ms
 * default on `transition-colors`). A shared string makes the next drift a
 * deliberate edit rather than an accident.
 *
 * Every value here reads a token from app/globals.css. Nothing is literal.
 */

/**
 * The focus indicator, identical on every interactive primitive.
 *
 * globals.css already sets a global `:focus-visible` outline, so this is
 * deliberately the same shape (2px, 2px offset, `--ring`) rather than a second
 * competing treatment. Declaring it per-primitive means the ring survives a
 * call site that resets outlines, and makes it greppable.
 *
 * `--ring` is not mapped into `@theme inline`, so there is no `outline-ring`
 * utility; the `color:` hint is required or Tailwind cannot tell an arbitrary
 * outline colour from an arbitrary outline width.
 *
 * Never add `outline-none` here or at a call site without replacing the ring.
 */
export const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--ring)]";

/**
 * Press feedback. One depth for every control size — Instrument is precise, not
 * springy, so this is a shallow settle rather than a bounce. `transition`
 * (not `transition-all`) covers colour, opacity, shadow and transform, which is
 * exactly the set these primitives animate.
 */
export const pressFeedback =
  "transition duration-[var(--duration-fast)] ease-out active:scale-[0.98]";

/** One disabled treatment. Non-interactive and visibly recessive, not invisible. */
export const disabledState = "disabled:pointer-events-none disabled:opacity-50";

/** The full interactive state set, for primitives that want all three. */
export const interactive = [focusRing, pressFeedback, disabledState].join(" ");
