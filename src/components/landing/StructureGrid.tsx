import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { STRUCTURES } from "@/curriculum/structures";
import { StructureCard } from "./StructureCard";

export function StructureGrid() {
  return (
    <section id="structures" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold text-fg-muted">Every structure, drawn as itself</p>
        <h2 className="mt-2 text-balance text-xl font-semibold tracking-tight text-fg sm:text-2xl">
          Eight worlds to explore
        </h2>
        <p className="mt-3 text-pretty text-md leading-relaxed text-fg-muted">
          No generic bars. A tree branches, a list chains, a graph webs — each with its own bespoke,
          beautiful visualization you can step through at your own pace.
        </p>
      </div>
      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STRUCTURES.map((s, i) => (
          <StructureCard key={s.slug} s={s} index={i} />
        ))}
      </div>
      <div className="mt-14 flex flex-col items-center gap-3">
        <p className="text-sm text-fg-muted">Prefer to wander? See how every structure connects.</p>
        <Link
          href="/learn"
          className="group inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface px-5 py-2.5 text-sm font-medium text-fg transition-colors hover:border-line-strong hover:text-fg"
        >
          Explore the map
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </section>
  );
}
