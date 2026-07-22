import type { MetadataRoute } from "next";
import { PROBLEMS } from "@/curriculum/catalog";
import { FOUNDATIONS } from "@/curriculum/foundations";
import { LESSONS } from "@/curriculum/lesson-catalog";
import { absoluteUrl } from "@/lib/site";

/**
 * Flat sitemap of every real, 200-returning URL. One file is correct here:
 * generateSitemaps is only for >50k-URL sets, and this is ~20.
 *
 * No `priority`/`changeFrequency` — Google ignores both. No `lastModified` —
 * we have no honest per-URL modified date, and Google only trusts it when it's
 * accurate, so a fabricated `new Date()` would be worse than omitting it.
 *
 * Only lesson structures that actually have a lesson are listed (the rest 404),
 * matching /learn/[structure]'s generateStaticParams. Every Foundations unit is
 * listed — /learn/foundations/[unit] pre-renders all of FOUNDATIONS (the bare
 * /learn/foundations is a redirect, so it is deliberately absent). resolveProblem
 * killed the old soft-404, so every /problem/<slug> here is a real page.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = ["/", "/problems", "/learn"];
  const problemPaths = PROBLEMS.map((p) => `/problem/${p.slug}`);
  const foundationPaths = FOUNDATIONS.map((u) => `/learn/foundations/${u.slug}`);
  const lessonPaths = Object.keys(LESSONS).map((s) => `/learn/${s}`);

  return [...staticPaths, ...problemPaths, ...foundationPaths, ...lessonPaths].map((path) => ({
    url: absoluteUrl(path),
  }));
}
