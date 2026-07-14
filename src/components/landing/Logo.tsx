import { cn } from "@/lib/utils";

export function Logo({ withText = true, className }: { withText?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
        <rect x="2.5" y="15" width="6" height="8" rx="2" fill="var(--brand)" />
        <rect x="10" y="9.5" width="6" height="13.5" rx="2" fill="var(--brand-strong)" />
        <rect x="17.5" y="3.5" width="6" height="19.5" rx="2" fill="var(--accent-cyan)" />
      </svg>
      {withText && (
        <span className="text-[15px] font-semibold tracking-tight text-fg">Stepwise</span>
      )}
    </span>
  );
}
