/**
 * The site's canonical origin, resolved once so every canonical/OG URL points at
 * the same place.
 *
 * Preview and production builds without NEXT_PUBLIC_SITE_URL fall back to the
 * production origin on purpose: a canonical must always name production, never a
 * per-deploy preview URL, or Google indexes the preview. platform-engineer sets
 * NEXT_PUBLIC_SITE_URL in Vercel to override (e.g. once a custom domain lands).
 * The trailing slash is stripped so `absoluteUrl` never produces a double slash.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://stepwise-beta.vercel.app"
).replace(/\/$/, "");

/** Resolve a root-relative path to an absolute URL against SITE_URL. */
export const absoluteUrl = (path: string): string =>
  new URL(path, SITE_URL).toString();
