import type { Trace } from "@/engine/types";
import { getExample } from "./registry";

/** Traces are pure functions of (exampleId, datasetId) — memoize them. */
const cache = new Map<string, Trace>();

export function getTrace(exampleId: string, datasetId = "default"): Trace | null {
  const key = `${exampleId}:${datasetId}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const ex = getExample(exampleId);
  if (!ex) return null;

  const ds = ex.datasets.find((d) => d.id === datasetId) ?? ex.datasets[0];
  const trace = ex.build(ds);
  cache.set(key, trace);
  return trace;
}
