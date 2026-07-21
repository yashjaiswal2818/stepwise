"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Check, Plus } from "lucide-react";
import { getCustomSpec } from "@/algorithms/custom";
import { useWorkspace } from "@/engine/player/workspace";
import { cn } from "@/lib/utils";

/**
 * Compact popover for typing your own input. Writes through the same
 * `useWorkspace.applyCustom` path the AI tutor uses, so both stay in sync.
 */
export function CustomInput({ exampleId, firstDatasetId }: { exampleId: string; firstDatasetId: string }) {
  const spec = getCustomSpec(exampleId);
  const datasetId = useWorkspace((s) => s.datasetId);
  const customError = useWorkspace((s) => s.customError);
  const applyCustom = useWorkspace((s) => s.applyCustom);
  const selectDataset = useWorkspace((s) => s.selectDataset);
  const clearError = useWorkspace((s) => s.clearError);

  const [open, setOpen] = useState(false);
  const [values, setValues] = useState("");
  const [arg, setArg] = useState("");
  const popRef = useRef<HTMLDivElement>(null);
  const active = datasetId === "custom";

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  if (spec.kind === "none") return null;

  const run = () => {
    const res = applyCustom(values, arg);
    if (res.ok) setOpen(false);
  };

  const reset = () => {
    selectDataset(firstDatasetId);
    setValues("");
    setArg("");
    clearError();
  };

  return (
    <div className="relative" ref={popRef}>
      <button
        onClick={() => {
          clearError();
          setOpen((o) => !o);
        }}
        className={cn(
          "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-2xs font-medium transition-colors",
          active
            ? "border-line-strong bg-surface-3 text-fg"
            : "border-dashed border-line-strong bg-surface text-fg-muted hover:border-line-strong hover:text-fg",
        )}
      >
        {active ? (
          <>
            <Check className="size-3 shrink-0" aria-hidden />
            Custom
          </>
        ) : (
          <>
            <Plus className="size-3 shrink-0" aria-hidden />
            Your data
          </>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-30 w-72 rounded-lg border border-line bg-surface p-3 shadow-[var(--shadow-pop)]">
          <p className="mb-2 text-2xs font-medium text-fg-faint">Run on your own input</p>
          <div className="flex flex-col gap-2">
            <input
              autoFocus
              value={values}
              onChange={(e) => setValues(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && run()}
              placeholder={spec.placeholder}
              className="w-full rounded-sm border border-line bg-base px-2.5 py-1.5 text-sm text-fg"
            />
            {spec.arg && (
              <input
                value={arg}
                onChange={(e) => setArg(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && run()}
                placeholder={spec.arg.label}
                inputMode="numeric"
                className="w-full rounded-sm border border-line bg-base px-2.5 py-1.5 text-sm text-fg"
              />
            )}
            {spec.note && <p className="text-2xs leading-snug text-fg-faint">{spec.note}</p>}
            {/* There is no error hue in this system — chroma is spent on algorithm
                state alone. A rejection is carried achromatically by an icon plus
                words at full foreground weight (the AuthError pattern), which also
                clears AA at any size, unlike the previous saturated text-rose-500. */}
            {customError && (
              <p role="alert" className="flex items-start gap-1 text-xs leading-snug text-fg">
                <AlertTriangle className="mt-0.5 size-3 shrink-0" aria-hidden />
                {customError}
              </p>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={run}
                className="rounded-sm bg-accent px-3 py-1.5 text-xs font-semibold text-accent-fg transition-opacity hover:opacity-90"
              >
                Run
              </button>
              {active && (
                <button
                  onClick={reset}
                  className="rounded-sm px-2 py-1.5 text-xs font-medium text-fg-muted hover:text-fg"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
