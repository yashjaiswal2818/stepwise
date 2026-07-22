import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { LearnThroughline } from "@/components/learn/LearnThroughline";

const url = "/learn";
const description =
  "A guided path through data structures and algorithms — start with what each structure actually is, then step through the algorithms that operate on it, one operation at a time.";

export const metadata: Metadata = {
  title: "Learn",
  description,
  alternates: { canonical: url },
  openGraph: {
    type: "website",
    siteName: "Stepwise",
    url,
    title: "Learn",
    description,
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image", title: "Learn", description },
};

/**
 * /learn — "The Index". A native-scrolling reading instrument (not a pan/zoom
 * map): one achromatic vertical spine you advance down, which is the whole scale
 * story — the page only ever gets taller.
 */
export default function LearnPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-5 sm:px-8">
          <LearnThroughline />
        </div>
      </main>
    </div>
  );
}
