import type { Metadata } from "next";
import { SiteChrome } from "@/components/SiteChrome";
import { ProblemList } from "@/components/problems/ProblemList";
import { PROBLEMS } from "@/curriculum/catalog";

const url = "/problems";
// Count is derived — never hardcode it. This repo shipped a stale "15+" once.
const description = `Browse all ${PROBLEMS.length} problems on Stepwise — each a data structure or algorithm you step through one operation at a time, with color that encodes state and an AI tutor that nudges instead of handing over the answer.`;

export const metadata: Metadata = {
  title: "Problems",
  description,
  alternates: { canonical: url },
  openGraph: {
    type: "website",
    siteName: "Stepwise",
    url,
    title: "Problems",
    description,
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image", title: "Problems", description },
};

export default function ProblemsPage() {
  return (
    <SiteChrome>
      <div className="mx-auto max-w-3xl px-5 py-12">
        <h1 className="text-3xl font-semibold tracking-tight text-fg">Problems</h1>
        <p className="mt-2 text-md text-fg-muted">
          {PROBLEMS.length} canonical problems, each with its own bespoke, step-through visualization.
        </p>
        <div className="mt-8">
          <ProblemList problems={PROBLEMS} />
        </div>
      </div>
    </SiteChrome>
  );
}
