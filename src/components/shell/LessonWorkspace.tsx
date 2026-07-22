"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SplitView } from "./SplitView";
import { VisualizationCanvas } from "@/engine/canvas/VisualizationCanvas";
import { Legend } from "@/engine/canvas/Legend";
import { PlayerControls } from "@/engine/player/PlayerControls";
import { PredictGate } from "@/engine/player/PredictGate";
import { CodePanel } from "@/engine/code/CodePanel";
import { Narration } from "@/engine/code/Narration";
import { WatchPanel } from "@/engine/code/WatchPanel";
import { usePlayer } from "@/engine/player/store";
import { usePlaybackLoop } from "@/engine/player/usePlaybackLoop";
import { usePlayerHotkeys } from "@/engine/player/usePlayerHotkeys";
import { authoredGates } from "@/engine/player/gates";
import { useProgress } from "@/engagement/useProgress";
import { getTrace } from "@/algorithms/getTrace";
import type { ElementState } from "@/engine/types";
import type { LessonMeta } from "@/curriculum/lesson-catalog";

const EMPTY_STATES: ElementState[] = [];

/**
 * The workspace for a Chapter. It reuses the entire player/canvas/code stack a
 * problem uses — the only differences are register, not machinery: no difficulty,
 * no datasets, no custom input, and a code panel that *grows* as the lesson runs
 * (driven by `Step.linesWritten`, handled inside CodePanel).
 */
export function LessonWorkspace({ meta }: { meta: LessonMeta }) {
  const exampleId = meta.exampleId;
  const load = usePlayer((s) => s.load);
  const legend = usePlayer((s) => s.trace?.legend ?? EMPTY_STATES);

  useEffect(() => {
    const trace = getTrace(exampleId, "default");
    if (trace) load(trace);
    const params = new URLSearchParams(window.location.search);
    const step = params.get("step");
    if (step !== null) usePlayer.getState().seek(parseInt(step, 10) || 0);
    else if (params.get("autoplay") !== null) usePlayer.getState().play();
  }, [exampleId, load]);

  usePlaybackLoop();
  usePlayerHotkeys();

  // Chapters carry AUTHORED gates only, exactly where the tracer staged them —
  // no derived quizzing in an expository register. "Stop asking" is honored
  // globally (expertise reversal: the learner means it everywhere).
  const lessonGates = useProgress((s) => s.predictions.lessons);
  const setPredictions = useProgress((s) => s.setPredictions);
  const loadedTrace = usePlayer((s) => s.trace);
  const gateOpen = usePlayer((s) => !!s.gate);
  useEffect(() => {
    if (!loadedTrace) return;
    usePlayer.getState().setGates(lessonGates ? authoredGates(loadedTrace) : new Map());
  }, [loadedTrace, lessonGates]);

  // A visit still counts toward the streak. Completion of a *lesson* is tracked
  // separately from solving a problem (see the `read`/`markRead` progress work),
  // so this deliberately does NOT call markSolved — a lesson is not a problem and
  // must not inflate the solved count the Completionist badge reads.
  const registerActivity = useProgress((s) => s.registerActivity);
  const setLastVisited = useProgress((s) => s.setLastVisited);
  useEffect(() => {
    registerActivity();
  }, [registerActivity]);
  // Remember this lesson as the place to "jump back in" from /learn.
  useEffect(() => {
    setLastVisited({ href: `/learn/${meta.structure}`, title: meta.title });
  }, [meta.structure, meta.title, setLastVisited]);

  const left = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-line px-5 py-4">
        <Link
          href="/learn"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-fg-muted transition-colors duration-[var(--duration-fast)] hover:text-fg"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          The map
        </Link>
        <p className="mt-3 text-xs font-medium text-fg-muted">Chapter · {meta.structure}</p>
        <h1 className="mt-1 text-lg font-semibold text-fg">{meta.title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-fg-muted">{meta.about}</p>
      </div>
      <div className="min-h-0 flex-1 p-4">
        <CodePanel />
      </div>
    </div>
  );

  const right = (
    <div className="flex h-full min-h-0 flex-col bg-base">
      <div className="min-h-0 flex-1">
        <VisualizationCanvas />
      </div>
      {/* Caption + variables read WITH the canvas, above the fixed transport.
          A chapter is expository, so the why register renders inline — problems
          keep the reveal-on-demand default (the learner attempts the reason first). */}
      <div className="shrink-0">
        {gateOpen ? (
          <PredictGate onStopAsking={() => setPredictions({ lessons: false })} />
        ) : (
          <Narration whyMode="inline" />
        )}
        <WatchPanel />
        <Legend states={legend} />
        <PlayerControls />
      </div>
    </div>
  );

  return (
    <SplitView
      className="flex-1"
      left={left}
      right={right}
      leftLabel="Code"
      rightLabel="Walkthrough"
      scrollPanes={false}
    />
  );
}
