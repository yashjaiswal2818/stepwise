import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { FEATURED } from "@/curriculum/structures";
import { DifficultyTag } from "@/design-system/ui/Badge";

export function FeaturedStrip() {
  return (
    <section className="mx-auto max-w-6xl px-5 pb-8">
      <div className="mb-5 flex items-end justify-between">
        <h2 className="text-lg font-semibold text-fg">Featured problems</h2>
        <Link href="/problems" className="text-sm font-medium text-fg-muted transition-colors hover:text-fg">
          Browse all →
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURED.map((ex) => (
          <Link
            key={ex.slug}
            href={`/problem/${ex.slug}`}
            className="group flex items-center justify-between rounded-xl border border-line bg-surface px-4 py-3 transition-all hover:border-line-strong hover:bg-surface-2"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium text-fg">{ex.title}</span>
                <ArrowUpRight className="size-3.5 shrink-0 text-fg-faint transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-fg" />
              </div>
              <p className="mt-0.5 text-xs text-fg-faint">{ex.topic}</p>
            </div>
            <DifficultyTag level={ex.difficulty} />
          </Link>
        ))}
      </div>
    </section>
  );
}
