import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { LessonWorkspace } from "@/components/shell/LessonWorkspace";
import { BreadcrumbJsonLd } from "@/components/JsonLd";
import { FOUNDATIONS, getFoundationUnit, nextFoundationUnit } from "@/curriculum/foundations";
import { isImplemented } from "@/algorithms/registry";

/** Pre-render every Foundations unit; anything else 404s like an unbuilt problem. */
export function generateStaticParams() {
  return FOUNDATIONS.map((u) => ({ unit: u.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ unit: string }>;
}): Promise<Metadata> {
  const { unit } = await params;
  const u = getFoundationUnit(unit);
  // Unknown unit → the page 404s, so emit no metadata.
  if (!u) return {};

  const title = u.title;
  const description = u.about;
  const url = `/learn/foundations/${u.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: "Stepwise",
      url,
      title,
      description,
      images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function FoundationUnitPage({ params }: { params: Promise<{ unit: string }> }) {
  const { unit } = await params;
  const u = getFoundationUnit(unit);
  if (!u || !isImplemented(u.exampleId)) notFound();

  const ordinal = FOUNDATIONS.findIndex((x) => x.slug === u.slug) + 1;
  const after = nextFoundationUnit(u.slug);
  // The reading order continues into the first structure — the last unit hands
  // off to the arrays chapter rather than dead-ending.
  const next = after
    ? { href: `/learn/foundations/${after.slug}`, label: `Next: ${after.title}` }
    : { href: "/learn/arrays", label: "First structure: What an array is" };

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Learn", path: "/learn" },
          { name: "Foundations", path: "/learn/foundations" },
          { name: u.title, path: `/learn/foundations/${u.slug}` },
        ]}
      />
      <Navbar />
      <LessonWorkspace
        view={{
          exampleId: u.exampleId,
          title: u.title,
          about: u.about,
          kicker: `Foundations · ${ordinal} of ${FOUNDATIONS.length}`,
          href: `/learn/foundations/${u.slug}`,
          next,
        }}
      />
    </div>
  );
}
