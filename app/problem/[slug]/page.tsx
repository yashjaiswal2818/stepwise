import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Eye, MousePointerClick, MessageSquareText } from "lucide-react";
import { ProblemTopbar } from "@/components/shell/ProblemTopbar";
import { SplitView } from "@/components/shell/SplitView";
import { PlaceholderCanvas } from "@/components/shell/PlaceholderCanvas";
import { ProblemWorkspace } from "@/components/shell/ProblemWorkspace";
import { BreadcrumbJsonLd } from "@/components/JsonLd";
import { Kbd } from "@/design-system/ui/Kbd";
import { PROBLEMS, resolveProblem, type Problem } from "@/curriculum/catalog";
import { isImplemented } from "@/algorithms/registry";

/** Prerender all 16 catalog problems at build time — no runtime resolution. */
export function generateStaticParams() {
  return PROBLEMS.map((p) => ({ slug: p.slug }));
}

/** One derived, unique meta description per problem from its real catalog fields.
 *  "an easy" / "a medium" / "a hard" keeps the article grammatical. */
function problemDescription(p: Problem): string {
  const difficulty = p.difficulty.toLowerCase();
  const article = /^[aeiou]/.test(difficulty) ? "an" : "a";
  return `Watch ${p.title} run one step at a time — ${article} ${difficulty} ${p.topic} problem visualized operation by operation, with an AI tutor that nudges instead of handing you the answer.`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = resolveProblem(slug);
  // Unknown slug: the page itself calls notFound(), so return nothing rather
  // than fabricate metadata for a page that will 404.
  if (!p) return {};

  const description = problemDescription(p);
  const url = `/problem/${slug}`;

  return {
    // The root template turns this into "<title> — Stepwise".
    title: p.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: "Stepwise",
      url,
      title: p.title,
      description,
      images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", title: p.title, description },
  };
}

const WATCH = [
  { icon: MousePointerClick, text: "Move one step at a time — forward is the hero control." },
  { icon: Eye, text: "Colors encode state: comparing, swapping, visited, done." },
  { icon: MessageSquareText, text: "A plain-English narration explains why each step happens." },
];

export default async function ProblemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = resolveProblem(slug);
  if (!p) notFound();

  const left = (
    <div className="mx-auto max-w-xl px-6 py-8">
      <div className="flex items-center gap-2 text-xs font-medium text-fg-faint">
        <span className="rounded-full bg-surface-2 px-2 py-0.5 text-fg-muted">{p.topic}</span>
        <span>·</span>
        <span>Tier {p.tier}</span>
      </div>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-fg">{p.title}</h1>

      <p className="mt-4 text-md leading-relaxed text-fg-muted">
        Watch <span className="text-fg">{p.title}</span> unfold one step at a time. The canvas on the
        right redraws after every operation, with color showing exactly what changed. Move at your own
        pace — the evidence says pacing control is what actually builds understanding.
      </p>

      <div className="mt-6 space-y-2.5">
        {WATCH.map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-start gap-3 rounded-xl border border-line bg-surface p-3">
            <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-sm bg-surface-3 text-fg">
              <Icon className="size-4" />
            </span>
            <p className="text-sm leading-relaxed text-fg-muted">{text}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-line bg-surface p-4">
        <p className="text-xs font-medium text-fg-faint">Keyboard</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-fg-muted">
          <span className="flex items-center gap-1.5"><Kbd>Space</Kbd> play / pause</span>
          <span className="flex items-center gap-1.5"><Kbd>←</Kbd><Kbd>→</Kbd> step</span>
          <span className="flex items-center gap-1.5"><Kbd>−</Kbd><Kbd>+</Kbd> speed</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-dvh flex-col">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Problems", path: "/problems" },
          { name: p.title, path: `/problem/${slug}` },
        ]}
      />
      <ProblemTopbar title={p.title} difficulty={p.difficulty} />
      {isImplemented(slug) ? (
        <ProblemWorkspace problem={p} />
      ) : (
        <SplitView className="flex-1" left={left} right={<PlaceholderCanvas structure={p.structure} />} />
      )}
    </div>
  );
}
