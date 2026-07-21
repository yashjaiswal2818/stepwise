"use client";

import type { ReactNode } from "react";
import { pressFeedback, focusRing } from "@/design-system/ui/interaction";
import { cn } from "@/lib/utils";

/** A small control for the mini data-structure toys on /learn. */
export function ToyButton({
  children,
  onClick,
  disabled,
  "aria-label": ariaLabel,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  "aria-label"?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border border-line bg-surface px-2 py-1 text-xs font-medium text-fg-muted",
        "hover:border-line-strong hover:text-fg disabled:pointer-events-none disabled:opacity-40",
        pressFeedback,
        focusRing,
      )}
    >
      {children}
    </button>
  );
}

/** The framed surface a toy sits in — a quiet card with a label and a hint. */
export function ToyFrame({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="rounded-md border border-line bg-surface/40 p-3">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <p className="text-2xs font-medium text-fg-muted">{label}</p>
        {hint && <p className="text-2xs text-fg-faint">{hint}</p>}
      </div>
      {children}
    </div>
  );
}
