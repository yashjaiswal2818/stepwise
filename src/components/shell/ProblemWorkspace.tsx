"use client";

import { useEffect } from "react";
import { SplitView } from "./SplitView";
import { CustomInput } from "./CustomInput";
import { VisualizationCanvas } from "@/engine/canvas/VisualizationCanvas";
import { Legend } from "@/engine/canvas/Legend";
import { PlayerControls } from "@/engine/player/PlayerControls";
import { CodePanel } from "@/engine/code/CodePanel";
import { Narration } from "@/engine/code/Narration";
import { WatchPanel } from "@/engine/code/WatchPanel";
import { AiTutor } from "@/components/tutor/AiTutor";
import { usePlayer } from "@/engine/player/store";
import { useWorkspace } from "@/engine/player/workspace";
import { usePlaybackLoop } from "@/engine/player/usePlaybackLoop";
import { usePlayerHotkeys } from "@/engine/player/usePlayerHotkeys";
import { useProgress } from "@/engagement/useProgress";
import { getTrace } from "@/algorithms/getTrace";
import { getExample } from "@/algorithms/registry";
import { buildCustomTrace, getCustomSpec } from "@/algorithms/custom";
import { getLesson } from "@/curriculum/lessons";
import type { ElementState } from "@/engine/types";
import type { Problem } from "@/curriculum/catalog";
import { cn } from "@/lib/utils";

const EMPTY_STATES: ElementState[] = [];

const DESCRIPTIONS: Record<string, string> = {
  "bubble-sort":
    "Repeatedly compare adjacent elements and swap them when they're out of order. After each pass the largest remaining value bubbles to its final position.",
  "quick-sort":
    "Pick a pivot, partition the range so smaller values sit left and larger sit right, then recurse on each side. The pivot lands in its final spot every partition.",
  "binary-search":
    "On a sorted array, check the middle element and discard the half that can't contain the target — halving the search space every step.",
  "two-pointers":
    "On a sorted array, start a pointer at each end. Move them inward based on whether the current sum is too small or too large until they meet the target.",
  "sliding-window":
    "Grow a window to the right one character at a time. When a character repeats, shrink the window from the left, tracking the longest window seen.",
  "valid-parentheses":
    "Scan the string, pushing every opening bracket. Each closing bracket must match the bracket on top of the stack — otherwise the string is invalid.",
  "reverse-linked-list":
    "Walk the list with three pointers. Save the next node, flip the current node's pointer to face backward, then advance — reversing the list in a single pass.",
  "detect-cycle":
    "Two pointers move at different speeds. If the list has a cycle, the fast pointer laps the slow one and they meet; if it reaches the end, there's no cycle.",
  "two-sum":
    "For each number, compute the complement that would reach the target. If we've already seen it, we're done; otherwise store the current number and keep scanning — O(n) with a hash map.",
  "merge-sort":
    "Recursively split the array into halves until each piece is trivially sorted, then merge sorted halves back together using a small buffer. Stable, O(n log n).",
  queue:
    "A queue is first-in, first-out. New items join at the rear; we always remove from the front — the opposite of a stack.",
  "binary-tree-traversal":
    "Walk every node of a tree. Switch the traversal order (in / pre / post / level) to see how the visit sequence changes — the recursion is tracked on the call stack.",
  "max-depth":
    "A node's depth is one plus the deeper of its two subtrees. The recursion descends to the leaves, then the call stack unwinds, computing each subtree's depth on the way back up.",
  "number-of-islands":
    "Scan a grid of land and water. Each time you hit unvisited land, flood-fill the whole connected island so it's counted once — the number of flood-fills is the island count.",
  dijkstra:
    "Grow a frontier outward from the start, always expanding the nearest unvisited cell. Each cell records its shortest distance; once the target is reached, trace the path back.",
  "bfs-dfs":
    "Explore a graph from a starting node. BFS uses a queue to sweep outward level by level; DFS uses a stack (recursion) to plunge deep before backtracking.",
};

function ComplexityPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2 px-2 py-0.5 text-[11px] font-medium">
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

  // Engagement: register a daily visit, and mark solved once the run is stepped to the end.
  const markSolved = useProgress((s) => s.markSolved);
  const registerActivity = useProgress((s) => s.registerActivity);
  const mode = useProgress((s) => s.mode);
  const atEnd = usePlayer((s) =>
    s.trace ? s.trace.steps.length > 1 && s.index >= s.trace.steps.length - 1 : false,
  );
  useEffect(() => {
    registerActivity();
  }, [registerActivity]);
  useEffect(() => {
    if (atEnd) markSolved(exampleId);
  }, [atEnd, exampleId, markSolved]);

  const left = (
    <div className="flex h-full flex-col">
      <div className="border-b border-line px-5 py-4">
        <p className="text-xs font-medium text-fg-faint">{problem.topic}</p>
        <h1 className="mt-1 text-lg font-semibold text-fg">{problem.title}</h1>
        {lesson && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            <ComplexityPill label="Time" value={lesson.time} />
            <ComplexityPill label="Space" value={lesson.space} />
          </div>
        )}
        {mode === "beginner" && (
          <>
            <p className="mt-3 text-[13px] leading-relaxed text-fg-muted">
              {DESCRIPTIONS[exampleId] ?? "Step through the algorithm and watch each change."}
            </p>
            {lesson && (
              <div className="mt-3 rounded-lg border border-line bg-surface-2/60 px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-fg-faint">Key idea</p>
                <p className="mt-1 text-[13px] leading-relaxed text-fg-muted">{lesson.idea}</p>
              </div>
            )}
          </>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-4">
        <CodePanel />
      </div>
      <Narration />
      <WatchPanel />
    </div>
  );

  const right = (
    <div className="flex h-full flex-col bg-base">
      {(datasets.length > 1 || hasCustom) && (
        <div className="flex items-center gap-2 border-b border-line px-4 py-2">
          <span className="shrink-0 text-[11px] font-medium text-fg-faint">Data</span>
          <div className="flex flex-wrap items-center gap-1.5">
            {datasets.map((d) => (
              <button
                key={d.id}
                onClick={() => useWorkspace.getState().selectDataset(d.id)}
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors",
                  d.id === datasetId
                    ? "border-brand bg-brand-soft text-brand-strong"
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
      <Legend states={legend} />
      <PlayerControls />
    </div>
  );

  return (
    <>
      <SplitView className="flex-1" left={left} right={right} leftLabel="Lesson" rightLabel="Visualization" />
      <AiTutor problem={problem} />
    </>
  );
}
