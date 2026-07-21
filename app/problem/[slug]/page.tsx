import { notFound } from "next/navigation";
import { Eye, MousePointerClick, MessageSquareText } from "lucide-react";
import { ProblemTopbar } from "@/components/shell/ProblemTopbar";
import { SplitView } from "@/components/shell/SplitView";
import { PlaceholderCanvas } from "@/components/shell/PlaceholderCanvas";
import { ProblemWorkspace } from "@/components/shell/ProblemWorkspace";
import { Kbd } from "@/design-system/ui/Kbd";
import { resolveProblem } from "@/curriculum/catalog";
import { isImplemented } from "@/algorithms/registry";

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
      <ProblemTopbar title={p.title} difficulty={p.difficulty} />
      {isImplemented(slug) ? (
        <ProblemWorkspace problem={p} />
      ) : (
        <SplitView className="flex-1" left={left} right={<PlaceholderCanvas structure={p.structure} />} />
      )}
    </div>
  );
}
