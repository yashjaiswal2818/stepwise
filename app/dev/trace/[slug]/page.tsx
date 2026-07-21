import { notFound } from "next/navigation";
import { getTrace } from "@/algorithms/getTrace";
import type { Scene } from "@/engine/types";

function summarize(scene: Scene): string {
  if (scene.kind === "array") {
    return scene.cells.map((c) => `${c.value}:${c.state[0]}`).join("  ");
  }
  return scene.kind;
}

/** Dev-only: dump a trace's steps for eyeballing without the full UI.
 *
 *  This route ships in the production bundle unless it refuses to render, so it
 *  refuses. It exposes no secrets, but it is an unpolished internal tool and a
 *  404 is the honest response for a stranger who finds it. */
export default async function TraceInspector({ params }: { params: Promise<{ slug: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();

  const { slug } = await params;
  const trace = getTrace(slug);
  if (!trace) notFound();

  return (
    <div className="min-h-dvh bg-base p-6 font-mono text-xs text-fg">
      <h1 className="text-sm font-semibold">
        {trace.title} · {trace.steps.length} steps · dataset “{trace.datasetId}”
      </h1>
      <p className="mb-4 text-fg-faint">Dev trace inspector</p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-left text-fg-faint">
              <th className="p-1 pr-3">#</th>
              <th className="p-1 pr-3">op</th>
              <th className="p-1 pr-3">lines</th>
              <th className="p-1 pr-3">narration</th>
              <th className="p-1">scene (value:state)</th>
            </tr>
          </thead>
          <tbody>
            {trace.steps.map((s) => (
              <tr key={s.i} className="border-t border-line align-top">
                <td className="p-1 pr-3 text-fg-faint">{s.i}</td>
                <td className="p-1 pr-3 text-fg">{s.op}</td>
                <td className="p-1 pr-3">{s.codeLines.join(",")}</td>
                <td className="max-w-[26rem] p-1 pr-3 text-fg-muted">{s.narration}</td>
                <td className="whitespace-pre p-1">{summarize(s.scene)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
