/**
 * The engine contract. This file has NO imports — every other module (renderers,
 * player, algorithms) depends on it, and it depends on nothing, so the engine
 * stays reusable and unit-testable in isolation.
 */

/** Universal state palette. Every visible element carries exactly one.
 *  Maps 1:1 to the legend and to the `--state-*` CSS variables. */
export type ElementState =
  | "default"
  | "active" // currently examined
  | "compare" // the counterpart in a comparison
  | "swap" // mid-swap this step
  | "visited" // done / seen
  | "frontier" // queued to be processed next
  | "path" // on the chosen path / detected cycle
  | "final"; // sorted / locked in / answer

export interface ElementBase {
  /** STABLE across the entire trace — this is what drives motion identity. */
  id: string;
  state: ElementState;
  /** Tiny caption drawn on/near the element (e.g. a pointer name). */
  label?: string;
  /** Longer accessible description. */
  hint?: string;
}

// ---- shared primitive vocabulary (reused by every family) ----
export interface Cell extends ElementBase {
  value: number | string;
  index: number;
}
export interface GNode extends ElementBase {
  value: number | string;
  group?: string;
  /** Preset coordinates for node-link graph layouts. */
  x?: number;
  y?: number;
}
export interface GEdge extends ElementBase {
  source: string;
  target: string;
  directed?: boolean;
  weight?: number;
}
/** A labelled pointer (i, j, low, high, slow, fast, pivot) aimed at an element id. */
export interface Pointer {
  id: string;
  label: string;
  target: string;
  color?: string;
}
/** A shaded span over a set of element ids (window, subarray, partition). */
export interface Region {
  id: string;
  label?: string;
  covers: string[];
  state: ElementState;
}
/** A call-stack frame for recursion visualizations. */
export interface Frame extends ElementBase {
  value: string;
  depth: number;
}

// ---- per-family view models (the discriminated union) ----
export interface ArrayScene {
  kind: "array";
  cells: Cell[];
  pointers: Pointer[];
  regions: Region[];
  /** Optional second row below the array (e.g. the merge buffer in merge sort). */
  aux?: { cells: Cell[]; label?: string };
}
export interface ListScene {
  kind: "list";
  nodes: GNode[];
  edges: GEdge[];
  pointers: Pointer[];
}
export interface StackScene {
  kind: "stack";
  frames: Cell[]; // drawn bottom -> top
  /** Optional scanned input sequence shown above the stack (e.g. the string). */
  input?: { cells: Cell[]; pointer?: number; label?: string };
}
export interface QueueScene {
  kind: "queue";
  items: Cell[];
  headId?: string;
  tailId?: string;
}
export interface HashEntry {
  id: string;
  key: string;
  value: string;
  state: ElementState;
}
export interface HashScene {
  kind: "hash";
  /** Optional scanned input array (e.g. nums in Two Sum). */
  input?: { cells: Cell[]; pointer?: number; label?: string };
  entries: HashEntry[];
  /** The key currently being looked up (the complement). */
  lookupKey?: string;
  mapLabel?: string;
}
export interface TreeScene {
  kind: "tree";
  nodes: GNode[];
  edges: GEdge[];
  callStack?: Frame[];
}
export interface GraphScene {
  kind: "graph";
  nodes: GNode[];
  edges: GEdge[];
  layout: "preset" | "force";
  /** Optional side panel (BFS queue / DFS stack). */
  frontier?: Frame[];
  label?: string;
}

export interface GridCell {
  id: string;
  r: number;
  c: number;
  value?: number | string;
  state: ElementState;
  /** false = wall / water (impassable). */
  passable?: boolean;
  /** Cost to enter this cell (pathfinding terrain); 1 = normal, >1 = costly. */
  weight?: number;
}
export interface GridScene {
  kind: "grid";
  rows: number;
  cols: number;
  cells: GridCell[];
  /** Optional side panel of frames (queue / priority queue). */
  frontier?: Frame[];
  label?: string;
}

export type Scene =
  | ArrayScene
  | ListScene
  | StackScene
  | QueueScene
  | HashScene
  | TreeScene
  | GraphScene
  | GridScene;

export type SceneKind = Scene["kind"];

export type StepOp =
  | "init"
  | "compare"
  | "swap"
  | "push"
  | "pop"
  | "enqueue"
  | "dequeue"
  | "visit"
  | "recurse"
  | "return"
  | "insert"
  | "set"
  | "mark"
  | "done";

export interface Step {
  /** 0-based index in the trace. */
  i: number;
  /** A complete, immutable snapshot — makes step-back and scrub O(1). */
  scene: Scene;
  /** Human-readable explanation of this step ("comparing 4 and 8"). */
  narration: string;
  /** 1-based source line(s) to highlight. */
  codeLines: number[];
  op?: StepOp;
  /** Scalar watch values shown in the Watch panel (i, j, sum, low, high…). */
  vars?: Record<string, string | number>;
}

export type Lang = "js" | "py" | "c";

/** An alternate-language rendering of an example, plus a map from the default
 *  (JS) highlighted line number to the corresponding line in this language. */
export interface AltSource {
  code: string;
  map: Record<number, number>;
}

export interface Trace {
  exampleId: string;
  title: string;
  /** Verbatim default (JS) source shown in the code panel; `codeLines` index it. */
  code: string;
  language: "ts";
  /** Optional Python / C renderings for the language toggle. */
  sources?: { py?: AltSource; c?: AltSource };
  datasetId: string;
  steps: Step[];
  /** States this example actually uses — drives the legend. */
  legend?: ElementState[];
}
