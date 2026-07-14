import type { ElementState } from "@/engine/types";
import { STATE_META } from "@/design-system/state-palette";

/** Documents the state palette for the current example. */
export function Legend({ states }: { states: ElementState[] }) {
  if (!states.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line px-4 py-2">
      <span className="text-[11px] font-medium text-fg-faint">Legend</span>
      {states.map((k) => (
        <span key={k} className="inline-flex items-center gap-1.5 text-[11px] text-fg-muted" title={STATE_META[k].description}>
          <span className="size-2.5 rounded-[3px]" style={{ background: STATE_META[k].cssVar }} />
          {STATE_META[k].label}
        </span>
      ))}
    </div>
  );
}
