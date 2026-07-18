import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

/**
 * The real auth gate: a DB-validated session check. Per Next's own guidance
 * (and CVE-2025-29927, the middleware-bypass class of bug), authorization must
 * live here — in the data-access layer, close to the data — not in proxy.ts /
 * middleware, which can be bypassed. Call this in every protected read/write.
 *
 * Memoized per-request via React `cache()` so multiple callers in one request
 * share a single session lookup. Returns null when signed out — the tutor's
 * anonymous path stays open, so callers decide what to do with null (serve
 * anonymously, 401, or redirect) rather than this forcing a redirect.
 */
export const getCurrentUser = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
});
