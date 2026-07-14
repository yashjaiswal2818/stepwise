"use client";

import { MotionConfig } from "motion/react";
import type { Scene } from "@/engine/types";
import { useCurrentStep } from "../player/store";
import { SPRING } from "./motion";
import { ArrayView } from "./renderers/ArrayView";
import { StackView } from "./renderers/StackView";
import { ListView } from "./renderers/ListView";
import { HashTableView } from "./renderers/HashTableView";
import { QueueView } from "./renderers/QueueView";
import { TreeView } from "./renderers/TreeView";
import { GridView } from "./renderers/GridView";
import { GraphView } from "./renderers/GraphView";

function Dispatch({ scene }: { scene: Scene }) {
  switch (scene.kind) {
    case "array":
      return <ArrayView scene={scene} />;
    case "stack":
      return <StackView scene={scene} />;
    case "list":
      return <ListView scene={scene} />;
    case "hash":
      return <HashTableView scene={scene} />;
    case "queue":
      return <QueueView scene={scene} />;
    case "tree":
      return <TreeView scene={scene} />;
    case "grid":
      return <GridView scene={scene} />;
    case "graph":
      return <GraphView scene={scene} />;
    default:
      return null;
  }
}

export function VisualizationCanvas() {
  const step = useCurrentStep();
  if (!step) {
    return <div className="grid h-full place-items-center text-sm text-fg-faint">Loading…</div>;
  }
  return (
    <div className="relative h-full w-full p-5 sm:p-8" role="img" aria-label={step.narration}>
      <MotionConfig transition={SPRING}>
        <Dispatch scene={step.scene} />
      </MotionConfig>
    </div>
  );
}
