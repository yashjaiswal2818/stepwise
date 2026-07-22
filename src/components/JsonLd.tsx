import { SITE_URL, absoluteUrl } from "@/lib/site";

/**
 * JSON-LD structured data. Two schemas are worth emitting here in 2026:
 * Organization (entity disambiguation — "Stepwise" collides with stepwise
 * regression and several shipping products, so a consistent named entity is the
 * lever) and BreadcrumbList (renders a trail in the SERP for /learn and /problem
 * pages). We deliberately do NOT emit SoftwareApplication — its rich result needs
 * genuine ratings/reviews, and fabricating them risks a manual action — nor any
 * dead-rich-result type (FAQPage/HowTo/LearningResource).
 *
 * These are server-rendered so answer bots and crawlers read them from the raw
 * HTML, not the client DOM.
 */

interface BreadcrumbItem {
  name: string;
  /** Root-relative path, e.g. "/problem/two-sum". */
  path: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function JsonLd({ data }: { data: Record<string, any> }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output is safe to inline; there is no user input here.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/** Organization — one canonical name and logo, no fabricated social links. */
export function OrganizationJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Stepwise",
        url: SITE_URL,
        description:
          "Interactive, step-by-step visualizations of data structures and algorithms with an AI tutor that nudges instead of handing over the answer.",
        logo: absoluteUrl("/stepwise.png"),
      }}
    />
  );
}

/** BreadcrumbList — the trail crawlers render in the result snippet. */
export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: item.name,
          item: absoluteUrl(item.path),
        })),
      }}
    />
  );
}
