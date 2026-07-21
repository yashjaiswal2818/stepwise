import { cn } from "@/lib/utils";

export function Logo({ withText = true, className }: { withText?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
        {/* Three ascending outlined bars on a shared baseline, heights 1:1.5:2.
            The mark is chrome, so the step reads as a value ramp in ink rather
            than three hues. Geometry mirrors public/stepwise.svg — the rects are
            the stroke centreline, inset half a stroke from the outer bounds —
            but here the tokens resolve directly instead of the media-query
            fallback a standalone file needs. */}
        <rect x="2.20" y="13.57" width="5.82" height="9.36" rx="0.76" stroke="var(--text-faint)" strokeWidth={1.13} />
        <rect x="10.07" y="8.22" width="5.82" height="14.72" rx="0.76" stroke="var(--text-muted)" strokeWidth={1.13} />
        <rect x="17.97" y="3.07" width="5.84" height="19.87" rx="0.76" stroke="var(--text)" strokeWidth={1.13} />
      </svg>
      {withText && (
        <span className="text-md font-semibold tracking-tight text-fg">Stepwise</span>
      )}
    </span>
  );
}
