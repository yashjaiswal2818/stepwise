import { RotateCcw, SkipBack, Play, SkipForward } from "lucide-react";
import { StructurePreview } from "@/components/landing/previews";
import type { StructureSlug } from "@/curriculum/structures";
import { STATE_META, type ElementState } from "@/design-system/state-palette";

const LEGEND: ElementState[] = ["active", "compare", "swap", "visited", "frontier", "final"];

/** Phase-1 placeholder: a live looping preview + the real control-bar layout the
    engine will drive in Phase 2. Structure-specific so every problem feels bespoke. */
export function PlaceholderCanvas({ structure }: { structure: StructureSlug }) {
  return (
    <div className="flex h-full flex-col bg-base">
      <div className="bg-grid relative flex-1">
        <div className="absolute inset-0 grid place-items-center p-6 sm:p-10">
          <div className="w-full max-w-lg">
            <div className="aspect-[16/10] w-full overflow-hidden rounded-2xl border border-line bg-elevated/70 shadow-[var(--shadow-md)]">
              <StructurePreview slug={structure} />
            </div>
            <p className="mt-4 text-center text-sm text-fg-muted">
              A live, structure-specific canvas. Step through it to see every change.
            </p>
          </div>
        </div>
      </div>

      {/* legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line px-4 py-2">
        <span className="text-[11px] font-medium text-fg-faint">Legend</span>
        {LEGEND.map((k) => (
          <span key={k} className="inline-flex items-center gap-1.5 text-[11px] text-fg-muted">
            <span className="size-2.5 rounded-[3px]" style={{ background: STATE_META[k].cssVar }} />
            {STATE_META[k].label}
          </span>
        ))}
      </div>

      {/* control bar (wired up in Phase 2) */}
      <div className="flex items-center gap-3 border-t border-line bg-surface px-4 py-3">
        <div className="flex items-center gap-1 text-fg-muted">
          <span className="grid size-8 place-items-center rounded-lg hover:bg-surface-2"><RotateCcw className="size-4" /></span>
          <span className="grid size-8 place-items-center rounded-lg hover:bg-surface-2"><SkipBack className="size-4" /></span>
          <span className="mx-0.5 grid size-9 place-items-center rounded-full bg-brand text-brand-fg shadow-[var(--shadow-glow)]">
            <Play className="size-4 translate-x-px fill-current" />
          </span>
          <span className="grid size-8 place-items-center rounded-lg hover:bg-surface-2"><SkipForward className="size-4" /></span>
        </div>
        <span className="rounded-md border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-fg-muted">1×</span>
        <div className="relative mx-1 h-1 flex-1 overflow-hidden rounded-full bg-surface-3">
          <div className="absolute inset-y-0 left-0 w-0 rounded-full bg-brand" />
        </div>
        <span className="shrink-0 font-mono text-[11px] text-fg-muted">Step 0 / 0</span>
      </div>
    </div>
  );
}
