"use client";

import type { ComponentType } from "react";
import type { StructureSlug } from "@/curriculum/structures";
import { ArrayToy } from "./ArrayToy";
import { StackToy } from "./StackToy";
import { QueueToy } from "./QueueToy";
import { LinkedListToy } from "./LinkedListToy";
import { HashToy } from "./HashToy";
import { TreeToy } from "./TreeToy";
import { GraphToy } from "./GraphToy";
import { RecursionToy } from "./RecursionToy";

/**
 * The playable mini data structure shown at the top of an open section on /learn —
 * touch the thing before you open a problem about it. Every structure has one.
 */
const TOYS: Record<StructureSlug, ComponentType> = {
  arrays: ArrayToy,
  "hash-tables": HashToy,
  "linked-lists": LinkedListToy,
  stacks: StackToy,
  queues: QueueToy,
  recursion: RecursionToy,
  trees: TreeToy,
  graphs: GraphToy,
};

export function StructureToy({ slug }: { slug: StructureSlug }) {
  const Toy = TOYS[slug];
  if (!Toy) return null;
  return (
    <div className="pb-1 pl-6 pt-1">
      <Toy />
    </div>
  );
}
