import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { LessonWorkspace } from "@/components/shell/LessonWorkspace";
import { BreadcrumbJsonLd } from "@/components/JsonLd";
import { LESSONS, getLessonMeta } from "@/curriculum/lesson-catalog";
import { STRUCTURES } from "@/curriculum/structures";
import { isImplemented } from "@/algorithms/registry";

/** Pre-render the structures that have a lesson; the rest 404 like an unbuilt problem. */
export function generateStaticParams() {
  return Object.keys(LESSONS).map((structure) => ({ structure }));
}

/** The structure's display name ("Arrays"), for the breadcrumb trail. */
function structureTitle(slug: string): string {
  return STRUCTURES.find((s) => s.slug === slug)?.title ?? slug;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ structure: string }>;
}): Promise<Metadata> {
  const { structure } = await params;
  const meta = getLessonMeta(structure);
  // No lesson for this structure → the page 404s, so emit no metadata.
  if (!meta) return {};

  const title = meta.title;
  const description = meta.about;
  const url = `/learn/${structure}`;

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

export default async function LessonPage({ params }: { params: Promise<{ structure: string }> }) {
  const { structure } = await params;
  const meta = getLessonMeta(structure);
  if (!meta || !isImplemented(meta.exampleId)) notFound();

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Learn", path: "/learn" },
          { name: structureTitle(structure), path: `/learn/${structure}` },
        ]}
      />
      <Navbar />
      <LessonWorkspace meta={meta} />
    </div>
  );
}
