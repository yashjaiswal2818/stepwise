import Link from "next/link";
import { buttonVariants } from "@/design-system/ui/Button";
import { PROBLEMS } from "@/curriculum/catalog";
import { cn } from "@/lib/utils";

/**
 * 404. Before this existed, an unknown slug rendered a real-looking but empty
 * problem page, which reads as "this feature is broken" rather than "that does
 * not exist".
 *
 * An empty state should teach the interface, so this one offers actual routes
 * forward instead of announcing emptiness.
 */
export default function NotFound() {
  const suggestions = PROBLEMS.slice(0, 4);

  return (
    <main className="grid min-h-dvh place-items-center px-6 py-16">
      <div className="w-full max-w-md">
        <p className="font-mono text-2xs text-fg-faint">404</p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-fg">
          There is no page here.
        </h1>
        <p className="mt-3 text-md leading-relaxed text-fg-muted">
          The link may be mistyped, or it may point at a problem that has not been built
          yet. There are {PROBLEMS.length} problems in the catalog right now.
        </p>

        <div className="mt-8">
          <p className="font-mono text-2xs text-fg-muted">Start somewhere</p>
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {suggestions.map((p) => (
              <li key={p.slug}>
                <Link
                  href={`/problem/${p.slug}`}
                  className="flex items-baseline justify-between gap-4 py-2.5 text-sm text-fg-muted transition-colors hover:text-fg"
                >
                  <span>{p.title}</span>
                  <span className="font-mono text-2xs text-fg-faint">{p.topic}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link href="/problems" className={cn(buttonVariants())}>
            All problems
          </Link>
          <Link href="/learn" className={cn(buttonVariants({ variant: "secondary" }))}>
            The learning map
          </Link>
        </div>
      </div>
    </main>
  );
}
