import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PROBLEMS } from "@/curriculum/catalog";
import { STRUCTURES, type StructureSlug } from "@/curriculum/structures";
import { isImplemented } from "@/algorithms/registry";
import { DifficultyTag } from "@/design-system/ui/Badge";
import { focusRing, pressFeedback } from "@/design-system/ui/interaction";
import { cn } from "@/lib/utils";

const MAX_SUGGESTIONS = 5;

/**
 * What the canvas pane shows for a catalog problem whose tracer does not exist yet.
 *
 * This used to render a looping decorative preview under the caption "step through
 * it to see every change" — which you could not — above a full transport bar with a
 * glowing play button, a `1×` speed chip, a hardcoded `w-0` progress fill and a
 * "Step 0 / 0" counter. None of it was wired to anything. That is the product's
 * named anti-pattern: depicting the product instead of being it. A learner who
 * pressed play and got nothing would learn that the controls in this app are
 * decoration, which is a far worse thing to teach than "not built yet".
 *
 * So: say plainly that it is not built, and spend the space on problems that are.
 * The suggestions are read from the real registry — a problem appears here only if
 * its tracer actually exists — which also means the current problem excludes itself
 * for free, since an implemented problem never renders this component.
 */
export function PlaceholderCanvas({ structure }: { structure: StructureSlug }) {
  const built = PROBLEMS.filter((p) => isImplemented(p.slug));
  const structureTitle = STRUCTURES.find((s) => s.slug === structure)?.title;

  // Nearest first: same structure, so the suggestion is a genuine substitute
  // rather than a random jump to another corner of the curriculum.
  const suggestions = [
    ...built.filter((p) => p.structure === structure),
    ...built.filter((p) => p.structure !== structure),
  ].slice(0, MAX_SUGGESTIONS);

  return (
    <div className="bg-rule flex h-full flex-col overflow-auto bg-base">
      <section
        aria-labelledby="not-built-heading"
        className="m-auto w-full max-w-md p-6 sm:p-10"
      >
        <div className="rounded-xl border border-line bg-surface p-5 shadow-[var(--lift)]">
          <h2 id="not-built-heading" className="text-lg font-semibold text-fg">
            This visualization isn&rsquo;t built yet
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-fg-muted">
            The problem is in the curriculum, but the instrumented version of the algorithm —
            the part that records every step so it can be drawn — hasn&rsquo;t been written.
            There is nothing real to step through, so this pane stays empty rather than showing
            controls that do nothing.
          </p>

          {suggestions.length > 0 && (
            <>
              <p className="mt-5 text-2xs font-medium text-fg-faint">
                {structureTitle ? `Running now, starting with ${structureTitle}` : "Running now"}
              </p>
              <ul className="mt-2 flex flex-col gap-1.5">
                {suggestions.map((p) => (
                  <li key={p.slug}>
                    <Link
                      href={`/problem/${p.slug}`}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg border border-line bg-surface-2 px-3 py-2.5",
                        "hover:border-line-strong hover:bg-surface-3",
                        pressFeedback,
                        focusRing,
                      )}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-base font-medium text-fg">
                          {p.title}
                        </span>
                        <span className="block truncate text-2xs text-fg-muted">{p.topic}</span>
                      </span>
                      <DifficultyTag level={p.difficulty} className="shrink-0" />
                      <ArrowRight
                        aria-hidden="true"
                        className="size-4 shrink-0 text-fg-faint transition-colors duration-[var(--duration-fast)] ease-out group-hover:text-fg"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}

          <Link
            href="/problems"
            className={cn(
              "mt-4 inline-flex items-center gap-1.5 rounded-xs text-sm font-medium text-fg-muted hover:text-fg",
              pressFeedback,
              focusRing,
            )}
          >
            All {built.length} problems
            <ArrowRight aria-hidden="true" className="size-3.5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
