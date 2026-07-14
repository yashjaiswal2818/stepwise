"use client";

import { useEffect, useRef, useState } from "react";
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
          "rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors",
          active
            ? "border-brand bg-brand-soft text-brand-strong"
            : "border-dashed border-line-strong bg-surface text-fg-muted hover:border-brand hover:text-fg",
        )}
      >
        {active ? "Custom ✓" : "＋ Your data"}
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-30 w-72 rounded-xl border border-line bg-surface p-3 shadow-xl">
          <p className="mb-2 text-[11px] font-medium text-fg-faint">Run on your own input</p>
          <div className="flex flex-col gap-2">
            <input
              autoFocus
              value={values}
              onChange={(e) => setValues(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && run()}
              placeholder={spec.placeholder}
              className="w-full rounded-lg border border-line bg-base px-2.5 py-1.5 text-[13px] text-fg outline-none focus:border-brand"
            />
            {spec.arg && (
              <input
                value={arg}
                onChange={(e) => setArg(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && run()}
                placeholder={spec.arg.label}
                inputMode="numeric"
                className="w-full rounded-lg border border-line bg-base px-2.5 py-1.5 text-[13px] text-fg outline-none focus:border-brand"
              />
            )}
            {spec.note && <p className="text-[11px] leading-snug text-fg-faint">{spec.note}</p>}
            {customError && <p className="text-[11px] leading-snug text-rose-500">{customError}</p>}
            <div className="flex items-center gap-2">
              <button
                onClick={run}
                className="rounded-lg bg-brand px-3 py-1.5 text-[12px] font-semibold text-white transition-opacity hover:opacity-90"
              >
                Run
              </button>
              {active && (
                <button
                  onClick={reset}
                  className="rounded-lg px-2 py-1.5 text-[12px] font-medium text-fg-muted hover:text-fg"
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
