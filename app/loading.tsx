/**
 * Route-level loading state. A skeleton rather than a spinner: it holds the
 * shape the content will occupy, so the page does not jump when it arrives.
 *
 * Deliberately static — no shimmer animation. `prefers-reduced-motion` would
 * have to suppress it anyway, and a still skeleton reads as "measuring", which
 * is the register we want.
 */
export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-16" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading</span>

      <div className="h-7 w-56 rounded-sm bg-surface-2" />
      <div className="mt-3 h-4 w-80 max-w-full rounded-sm bg-surface-2/70" />

      <div className="mt-10 space-y-px overflow-hidden rounded-lg border border-line">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-4 bg-surface px-4 py-3.5">
            <div className="h-4 w-4 shrink-0 rounded-xs bg-surface-3" />
            <div className="h-4 flex-1 rounded-sm bg-surface-2" style={{ maxWidth: `${58 - i * 7}%` }} />
            <div className="h-3 w-14 shrink-0 rounded-sm bg-surface-2/60" />
          </div>
        ))}
      </div>
    </div>
  );
}
