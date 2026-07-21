import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { interactive } from "./interaction";

type Variant = "primary" | "secondary" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

/* `relative` is load-bearing: the loading indicator is absolutely positioned
   over the label so the button keeps its exact width. */
const base = cn(
  "relative inline-flex items-center justify-center gap-2",
  "font-medium whitespace-nowrap select-none cursor-pointer",
  interactive,
);

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-accent-fg shadow-[var(--lift-hi)] hover:opacity-90",
  secondary:
    "bg-surface-2 text-fg border border-line hover:bg-surface-3 hover:border-line-strong",
  ghost: "text-fg-muted hover:text-fg hover:bg-surface-2",
  outline:
    "border border-line-strong text-fg hover:bg-surface-2 hover:border-line-strong",
};

/* Radius follows control height — see the radius scale in globals.css. */
const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-sm rounded-sm",
  md: "h-10 px-4 text-base rounded-md",
  lg: "h-12 px-6 text-base rounded-md",
};

export function buttonVariants({
  variant = "primary",
  size = "md",
}: { variant?: Variant; size?: Size } = {}) {
  return cn(base, variants[variant], sizes[size]);
}

/**
 * Indeterminate progress. A track ring plus a quarter arc, in `currentColor`,
 * so it is correct on every variant and in both themes without a colour of its
 * own — a button is chrome, and chrome is never saturated.
 *
 * Rotation is linear, never eased: an eased spinner reads as stuttering. Under
 * `prefers-reduced-motion` the global rule in globals.css collapses the
 * animation, which leaves a static ring-and-arc — still a legible "working"
 * glyph rather than a frozen half-drawn circle, and the state is carried
 * independently by `aria-busy` and `disabled` regardless.
 */
function Spinner() {
  return (
    <svg viewBox="0 0 16 16" className="size-4 animate-spin" aria-hidden="true">
      <circle
        cx="8"
        cy="8"
        r="6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.3"
      />
      <path
        d="M8 2a6 6 0 0 1 6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Button({
  variant,
  size,
  loading = false,
  disabled,
  type = "button",
  className,
  children,
  ...props
}: ComponentProps<"button"> & {
  variant?: Variant;
  size?: Size;
  /** Disables the button and swaps the label for an indeterminate indicator. */
  loading?: boolean;
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        buttonVariants({ variant, size }),
        /* Busy and unavailable are different states and must not look alike.
           `loading` uses the `disabled` attribute for its behaviour, so it
           would otherwise inherit the disabled dimming and leave the indicator
           muddy. tailwind-merge resolves this to the later of the two. */
        loading && "disabled:opacity-100",
        className,
      )}
      {...props}
    >
      {/* The label stays mounted and only loses opacity: it holds the button's
          width so the layout cannot jump, and it keeps the accessible name
          intact while loading. */}
      <span
        className={cn(
          "inline-flex items-center gap-2",
          loading && "opacity-0",
        )}
      >
        {children}
      </span>
      {loading ? (
        <span className="absolute inset-0 grid place-items-center">
          <Spinner />
        </span>
      ) : null}
    </button>
  );
}
