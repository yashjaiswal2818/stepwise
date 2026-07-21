import { SiteChrome } from "@/components/SiteChrome";
import { ProblemList } from "@/components/problems/ProblemList";
import { PROBLEMS } from "@/curriculum/catalog";

export default function ProblemsPage() {
  return (
    <SiteChrome>
      <div className="mx-auto max-w-3xl px-5 py-12">
        <h1 className="text-3xl font-semibold tracking-tight text-fg">Problems</h1>
        <p className="mt-2 text-md text-fg-muted">
          {PROBLEMS.length} canonical problems, each with its own bespoke, step-through visualization.
        </p>
        <div className="mt-8">
          <ProblemList problems={PROBLEMS} />
        </div>
      </div>
    </SiteChrome>
  );
}
