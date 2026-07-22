import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * Allow essentially everything. A site that wants to be recommended by AI answer
 * engines must never block the answer/index crawlers — OAI-SearchBot, Googlebot,
 * Bingbot, PerplexityBot, Claude-SearchBot. Blocking a *training* crawler (GPTBot,
 * ClaudeBot) would not protect a single citation, because live citation runs on
 * the answer bots, not the training ones — so there is no per-bot Disallow here at
 * all. The one unrecoverable mistake is a blanket block that catches an answer bot.
 *
 * Only /dev/ (internal tooling, also noindex'd at the page) and /api/ (no
 * indexable content) are disallowed. The sitemap is declared here because the
 * old sitemap-ping endpoint is dead; crawlers discover it from robots.txt and
 * Search Console.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dev/", "/api/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
