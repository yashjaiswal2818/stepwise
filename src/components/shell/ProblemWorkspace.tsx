"use client";

import { useEffect, useState } from "react";
import { SplitView } from "./SplitView";
import { CustomInput } from "./CustomInput";
import { VisualizationCanvas } from "@/engine/canvas/VisualizationCanvas";
import { Legend } from "@/engine/canvas/Legend";
import { PlayerControls } from "@/engine/player/PlayerControls";
import { PredictGate } from "@/engine/player/PredictGate";
import { CodePanel } from "@/engine/code/CodePanel";
import { Narration } from "@/engine/code/Narration";
import { WatchPanel } from "@/engine/code/WatchPanel";
import { AiTutor } from "@/components/tutor/AiTutor";
import { usePlayer } from "@/engine/player/store";
import { useWorkspace } from "@/engine/player/workspace";
import { usePlaybackLoop } from "@/engine/player/usePlaybackLoop";
import { usePlayerHotkeys } from "@/engine/player/usePlayerHotkeys";
import {
  authoredGates,
  clampFade,
  derivedGates,
  fadedGates,
  isQuizzable,
  mergeSchedules,
} from "@/engine/player/gates";
import { useProgress } from "@/engagement/useProgress";
import { Button } from "@/design-system/ui/Button";
import { getTrace } from "@/algorithms/getTrace";
import { getExample } from "@/algorithms/registry";
import { buildCustomTrace, getCustomSpec } from "@/algorithms/custom";
import { getLesson } from "@/curriculum/lessons";
import { getDescription } from "@/curriculum/descriptions";
import type { ElementState } from "@/engine/types";
import type { Problem } from "@/curriculum/catalog";
import { cn } from "@/lib/utils";

const EMPTY_STATES: ElementState[] = [];

function ComplexityPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2 px-2 py-0.5 text-2xs font-medium">
      <span className="text-fg-faint">{label}</span>
      <span className="font-mono text-fg">{value}</span>
    </span>
  );
}

export function ProblemWorkspace({ problem }: { problem: Problem }) {
  const exampleId = problem.slug;
  const ex = getExample(exampleId);
  const datasets = ex?.datasets ?? [];
  const firstDatasetId = datasets[0]?.id ?? "default";
  const lesson = getLesson(exampleId);
  const hasCustom = getCustomSpec(exampleId).kind !== "none";

  const load = usePlayer((s) => s.load);
  const legend = usePlayer((s) => s.trace?.legend ?? EMPTY_STATES);

  const datasetId = useWorkspace((s) => s.datasetId);
  const customValues = useWorkspace((s) => s.customValues);
  const customArg = useWorkspace((s) => s.customArg);

  // Initialize the workspace store when the problem changes; honor a ?dataset deep link.
  useEffect(() => {
    useWorkspace.getState().init(exampleId, firstDatasetId);
    const d = new URLSearchParams(window.location.search).get("dataset");
    if (d && datasets.some((x) => x.id === d)) useWorkspace.getState().selectDataset(d);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exampleId]);

  // Build + load the trace whenever the selection changes. Read fresh state so a
  // problem switch never builds a custom trace with the previous example's values.
  useEffect(() => {
    const ws = useWorkspace.getState();
    const trace =
      ws.datasetId === "custom" && ws.customValues
        ? buildCustomTrace(exampleId, ws.customValues, ws.customArg ?? undefined)
        : getTrace(exampleId, ws.datasetId);
    if (!trace) return;
    load(trace);
    // Optional deep links: ?step=N jumps to a step, ?autoplay starts playback.
    const params = new URLSearchParams(window.location.search);
    const step = params.get("step");
    if (step !== null) usePlayer.getState().seek(parseInt(step, 10) || 0);
    else if (params.get("autoplay") !== null) usePlayer.getState().play();
  }, [exampleId, datasetId, customValues, customArg, load]);

  usePlaybackLoop();
  usePlayerHotkeys();

  // ---- predict-gates -------------------------------------------------------
  // Scheduling is deliberately DECOUPLED from trace loading: this effect only
  // calls setGates, never load(), so flipping "Quiz me" or promoting a fade
  // level can never yank the learner back to step 0 or wipe their run stats.
  const quizPref = useProgress((s) => s.predictions.problems);
  const setPredictions = useProgress((s) => s.setPredictions);
  const fadeStored = useProgress((s) => s.fade[exampleId] ?? 0);
  const setFade = useProgress((s) => s.setFade);
  const loadedTrace = usePlayer((s) => s.trace);
  const gateOpen = usePlayer((s) => !!s.gate);
  const gateStats = usePlayer((s) => s.gateStats);
  // One-run deep-link overrides: ?quiz=1 (the bridge's "training wheels" link)
  // and ?fade=N. They never flip the persisted preference.
  const [override, setOverride] = useState<{ quiz: boolean; fade: number | null }>({ quiz: false, fade: null });
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const f = params.get("fade");
    // Post-hydration URL read is this file's established deep-link pattern
    // (?dataset/?step above). Reading in a lazy initializer instead would make
    // the server and client first renders disagree (aria-pressed on the quiz
    // chip) — a hydration error, which is the worse trade.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOverride({ quiz: params.has("quiz"), fade: f != null ? parseInt(f, 10) : null });
  }, [exampleId]);

  const fadeLevel = clampFade(override.fade ?? fadeStored);
  const quizOn = quizPref || override.quiz || fadeLevel > 0;
  const quizzable = loadedTrace ? isQuizzable(loadedTrace) : false;

  useEffect(() => {
    if (!loadedTrace) return;
    const authored = authoredGates(loadedTrace);
    const schedule =
      fadeLevel > 0
        ? mergeSchedules(authored, fadedGates(loadedTrace, fadeLevel))
        : quizOn
          ? mergeSchedules(authored, derivedGates(loadedTrace))
          : new Map();
    usePlayer.getState().setGates(schedule);
  }, [loadedTrace, quizOn, fadeLevel]);

  // Engagement: register a daily visit, and mark solved once the run is stepped to the end.
  const markSolved = useProgress((s) => s.markSolved);
  const registerActivity = useProgress((s) => s.registerActivity);
  const setLastVisited = useProgress((s) => s.setLastVisited);
  const atEnd = usePlayer((s) =>
    s.trace ? s.trace.steps.length > 1 && s.index >= s.trace.steps.length - 1 : false,
  );
  useEffect(() => {
    registerActivity();
  }, [registerActivity]);
  // Remember this as the place to "jump back in" from /learn.
  useEffect(() => {
    setLastVisited({ href: `/problem/${problem.slug}`, title: problem.title });
  }, [problem.slug, problem.title, setLastVisited]);
  useEffect(() => {
    if (atEnd) markSolved(exampleId);
  }, [atEnd, exampleId, markSolved]);

  const left = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-line px-5 py-4">
        <p className="text-xs font-medium text-fg-faint">{problem.topic}</p>
        <h1 className="mt-1 text-lg font-semibold text-fg">{problem.title}</h1>
        {lesson && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            <ComplexityPill label="Time" value={lesson.time} />
            <ComplexityPill label="Space" value={lesson.space} />
          </div>
        )}
        <p className="mt-3 text-sm leading-relaxed text-fg-muted">
          {getDescription(exampleId)}
        </p>
        {lesson && (
          <div className="mt-3 rounded-lg border border-line bg-surface-2/60 px-3 py-2">
            <p className="mt-0 text-xs font-semibold text-fg-muted">Key idea</p>
            <p className="mt-1 text-sm leading-relaxed text-fg-muted">{lesson.idea}</p>
          </div>
        )}
      </div>
      {/* CodePanel owns its own scroller so it can keep the active line in view.
          A scrolling wrapper here would give it an unbounded height, and the pane
          rather than the panel would be the thing that scrolls. */}
      <div className="min-h-0 flex-1 p-4">
        <CodePanel />
      </div>
    </div>
  );

  const right = (
    <div className="flex h-full min-h-0 flex-col bg-base">
      {(datasets.length > 1 || hasCustom) && (
        <div className="flex shrink-0 items-center gap-2 border-b border-line px-4 py-2">
          <span className="shrink-0 text-2xs font-medium text-fg-faint">Data</span>
          <div className="flex flex-wrap items-center gap-1.5">
            {datasets.map((d) => (
              <button
                key={d.id}
                onClick={() => useWorkspace.getState().selectDataset(d.id)}
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-2xs font-medium transition-colors",
                  d.id === datasetId
                    ? "border-line-strong bg-surface-3 text-fg"
                    : "border-line bg-surface text-fg-muted hover:border-line-strong hover:text-fg",
                )}
              >
                {d.label}
              </button>
            ))}
            {hasCustom && <CustomInput exampleId={exampleId} firstDatasetId={firstDatasetId} />}
          </div>
        </div>
      )}
      <div className="min-h-0 flex-1">
        <VisualizationCanvas />
      </div>
      {/* The step's plain-English caption and its variables sit WITH the canvas —
          where the eye already is — reading like a figure caption beneath it. The
          transport is the hero control and stays pinned to the very bottom; only
          the canvas above this group flexes. A predict-gate SWAPS into the
          narration slot (same voice, different mood) rather than stacking. */}
      <div className="shrink-0">
        {gateOpen ? (
          <PredictGate
            onStopAsking={() => {
              setOverride((o) => ({ ...o, quiz: false, fade: null }));
              setPredictions({ problems: false });
            }}
          />
        ) : (
          <Narration />
        )}
        {!gateOpen && atEnd && gateStats.asked > 0 && (
          // End-of-run instrument reading. Numbers derive from the store —
          // never invented — and promotion happens ONLY on the explicit
          // "Run again" action, never reactively.
          <div className="flex flex-wrap items-center gap-3 border-t border-line px-5 py-3 sm:px-6">
            <span className="font-mono text-xs tabular-nums text-fg-muted">
              You called {gateStats.correct} of {gateStats.asked} moves.
            </span>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                const promotable =
                  gateStats.skipped === 0 && gateStats.correct / gateStats.asked >= 0.75 && fadeLevel < 3;
                if (promotable) setFade(exampleId, fadeLevel + 1);
                setOverride((o) => ({ ...o, fade: null }));
                usePlayer.getState().reset();
              }}
            >
              {gateStats.skipped === 0 && gateStats.correct / gateStats.asked >= 0.75 && fadeLevel < 3
                ? "Run again — you drive more of it"
                : "Run again"}
            </Button>
            {fadeLevel > 0 && (
              <button
                type="button"
                onClick={() => {
                  setFade(exampleId, fadeLevel - 1);
                  setOverride((o) => ({ ...o, fade: null }));
                  usePlayer.getState().reset();
                }}
                className="text-xs font-medium text-fg-muted hover:text-fg"
              >
                More worked steps
              </button>
            )}
          </div>
        )}
        <WatchPanel />
        <Legend states={legend} />
        <PlayerControls
          quiz={{
            on: quizOn,
            available: quizzable,
            onToggle: () => {
              if (quizOn) {
                setOverride({ quiz: false, fade: null });
                setPredictions({ problems: false });
              } else {
                setPredictions({ problems: true });
              }
            },
          }}
        />
      </div>
    </div>
  );

  return (
    <>
      {/* scrollPanes={false}: both panes are full-height columns that scroll their
          own middle section, so the transport bar stays pinned to the bottom of the
          viewport on mobile instead of scrolling out of reach with the pane. */}
      <SplitView
        className="flex-1"
        left={left}
        right={right}
        leftLabel="Code"
        rightLabel="Visualization"
        scrollPanes={false}
      />
      <AiTutor problem={problem} />
    </>
  );
}
