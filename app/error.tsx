"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/design-system/ui/Button";
import { cn } from "@/lib/utils";

/**
 * Root error boundary. Before this existed, any throw inside a renderer blanked
 * the whole app with no recovery path.
 *
 * A rendering bug here usually means one algorithm's scene data is malformed,
 * not that the site is down — so the copy says what is still reachable rather
 * than apologising in the abstract.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[stepwise] unhandled error", error);
  }, [error]);

  return (
    <main className="grid min-h-dvh place-items-center px-6 py-16">
      <div className="w-full max-w-md">
        <p className="font-mono text-2xs text-fg-faint">error</p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-fg">
          This visualization stopped working.
        </h1>
        <p className="mt-3 text-md leading-relaxed text-fg-muted">
          Something threw while drawing this page. It is almost certainly a bug in one
          algorithm rather than a problem with the whole site — the other problems should
          still run.
        </p>

        {error.digest ? (
          <p className="mt-4 font-mono text-xs text-fg-muted">
            <span className="text-fg-faint">digest</span> {error.digest}
          </p>
        ) : null}

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button onClick={reset}>Try again</Button>
          <Link href="/problems" className={cn(buttonVariants({ variant: "secondary" }))}>
            Browse problems
          </Link>
        </div>

        <p className="mt-8 text-sm text-fg-muted">
          If it keeps happening,{" "}
          <a
            href="https://github.com/anthropics/stepwise/issues/new?template=bug_report.yml"
            className="text-fg underline underline-offset-4"
            target="_blank"
            rel="noreferrer noopener"
          >
            open an issue
          </a>{" "}
          with that digest — it tells us exactly which step broke.
        </p>
      </div>
    </main>
  );
}
