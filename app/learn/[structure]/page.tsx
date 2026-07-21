import { notFound } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { LessonWorkspace } from "@/components/shell/LessonWorkspace";
import { LESSONS, getLessonMeta } from "@/curriculum/lesson-catalog";
import { isImplemented } from "@/algorithms/registry";

/** Pre-render the structures that have a lesson; the rest 404 like an unbuilt problem. */
export function generateStaticParams() {
  return Object.keys(LESSONS).map((structure) => ({ structure }));
}

export default async function LessonPage({ params }: { params: Promise<{ structure: string }> }) {
  const { structure } = await params;
  const meta = getLessonMeta(structure);
  if (!meta || !isImplemented(meta.exampleId)) notFound();

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <Navbar />
      <LessonWorkspace meta={meta} />
    </div>
  );
}
