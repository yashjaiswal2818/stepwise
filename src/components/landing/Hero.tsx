import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { HeroPreview } from "./HeroPreview";
import { buttonVariants } from "@/design-system/ui/Button";
import { getTrace } from "@/algorithms/getTrace";
import { PROBLEMS, TIERS } from "@/curriculum/catalog";
import { cn } from "@/lib/utils";

/**
 * The example the hero runs. Bubble Sort, for three reasons:
 *   1. Its scene is a single row of six cells — the widest, shortest and most
 *      height-stable layout the engine produces, so it survives the hero frame
 *      at any width and never reflows mid-run. (Two Sum's map grows as it
 *      scans, which means the frame changes height inside the loop.)
 *   2. Its 29 steps touch four of the seven state colors — compare, swap,
 *      final, default — so "color means algorithm state" is demonstrated
 *      rather than asserted, and without needing a legend.
 *   3. Numbers physically sliding into order needs no domain knowledge to
 *      parse. A stranger gets it in the five seconds the landing page has.
 */
const HERO_EXAMPLE = "bubble-sort";

/**
 * Deliberately a server component. `getTrace` reaches the whole algorithm
 * registry (all sixteen tracers); building the trace here keeps that code out
 * of the client bundle and ships the finished trace in the RSC payload
 * instead. It also puts the headline in the initial HTML.
 */
export function Hero() {
  const trace = getTrace(HERO_EXAMPLE);
  const structures = new Set(PROBLEMS.map((p) => p.structure)).size;

  return (
    <section className="relative border-b border-line">
      <div
        aria-hidden="true"
        className="bg-rule pointer-events-none absolute inset-0 -z-10 opacity-30 mask-[linear-gradient(to_bottom,black,transparent_70%)]"
      />

      <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-14 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:gap-12 lg:py-20">
        <div>
          <h1 className="text-balance text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
            See every step the algorithm takes.
          </h1>
          <p className="mt-5 max-w-prose text-pretty text-md leading-relaxed text-fg-muted">
            Stepwise executes the real code and redraws the structure after every operation. Pause
            anywhere, step backward, change the input — and watch the mechanism instead of
            memorizing the result.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link href="/learn" className={cn(buttonVariants({ size: "lg" }))}>
              Start the curriculum
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/problems"
              className="group inline-flex items-center gap-1.5 text-base font-medium text-fg-muted transition-colors duration-[var(--duration-fast)] hover:text-fg"
            >
              Browse all {PROBLEMS.length} problems
              <ArrowUpRight className="size-4 transition-transform duration-[var(--duration-fast)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>

          <p className="mt-7 font-mono text-xs text-fg-faint">
            {TIERS.length} tiers · {structures} structures · nothing pre-recorded
          </p>
        </div>

        {trace && trace.steps.length > 0 ? (
          <HeroPreview trace={trace} />
        ) : (
          /* The demo is built at request time, so it can genuinely fail to
             build. Say so plainly and hand over the real workspace rather than
             leaving a hole in the fold. */
          <div className="rounded-2xl border border-line bg-surface p-8 shadow-[var(--lift)]">
            <p className="text-md text-fg-muted">
              The live demo could not be built for this request.
            </p>
            <Link
              href={`/problem/${HERO_EXAMPLE}`}
              className="group mt-4 inline-flex items-center gap-1.5 text-base font-medium text-fg transition-colors duration-[var(--duration-fast)] hover:text-fg-muted"
            >
              Open it in the workspace
              <ArrowUpRight className="size-4 transition-transform duration-[var(--duration-fast)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
