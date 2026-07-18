/**
 * Executes every registered problem against every one of its datasets and
 * asserts the invariants a visualization must satisfy.
 *
 * This is the gate for generated problems (see `pnpm add-problem`), but it earns
 * its keep on the hand-written catalog too: the `L` line-anchor maps in each
 * tracer are maintained by hand against an inert SOURCE string, and they rot
 * silently when the source is edited. A trace that points at a line which no
 * longer exists highlights the wrong code — the checker catches that mechanically.
 *
 *   pnpm validate:traces
 *
 * Exits non-zero on any failure so it can gate CI.
 */
import { REGISTRY, type Dataset } from "../src/algorithms/registry";
import type { Trace } from "../src/engine/types";
import { checkTrace } from "./lib/trace-checks";

function main(): void {
  const only = process.argv[2]; // optional: validate a single slug
  const entries = Object.entries(REGISTRY).filter(([slug]) => !only || slug === only);

  if (!entries.length) {
    console.error(only ? `No registered problem "${only}".` : "REGISTRY is empty.");
    process.exit(1);
  }

  let checked = 0;
  let failed = 0;

  for (const [slug, def] of entries) {
    for (const ds of def.datasets as Dataset[]) {
      checked++;
      let trace: Trace;
      try {
        trace = def.build(ds);
      } catch (err) {
        failed++;
        console.error(`✗ ${slug} [${ds.id}] threw while building:`);
        console.error(`    ${err instanceof Error ? err.message : String(err)}`);
        continue;
      }

      const errors = checkTrace(trace);
      if (errors.length) {
        failed++;
        console.error(`✗ ${slug} [${ds.id}] — ${errors.length} problem(s):`);
        for (const e of errors.slice(0, 8)) console.error(`    ${e}`);
        if (errors.length > 8) console.error(`    …and ${errors.length - 8} more`);
      } else {
        console.log(`✓ ${slug} [${ds.id}] — ${trace.steps.length} steps`);
      }
    }
  }

  console.log(`\n${checked - failed}/${checked} traces valid.`);
  if (failed) {
    console.error(`${failed} failing. A wrong visualization teaches a wrong mental model — fix before shipping.`);
    process.exit(1);
  }
}

main();
