"use client";

import type { ComponentType } from "react";
import type { StructureSlug } from "@/curriculum/structures";
import { ArrayToy } from "./ArrayToy";
import { StackToy } from "./StackToy";
import { NotationToy } from "./NotationToy";
import { QueueToy } from "./QueueToy";
import { LinkedListToy } from "./LinkedListToy";
import { HashToy } from "./HashToy";
import { TreeToy } from "./TreeToy";
import { GraphToy } from "./GraphToy";
import { RecursionToy } from "./RecursionToy";

/**
 * The playable mini data structure(s) shown at the top of an open section on
 * /learn — touch the thing before you open a problem about it. Most structures
 * have one; stacks have two (push/pop, then the expression-notation toy that
 * sets up the infix -> postfix problem).
 */
const TOYS: Record<StructureSlug, ComponentType[]> = {
  arrays: [ArrayToy],
  "hash-tables": [HashToy],
  "linked-lists": [LinkedListToy],
  stacks: [StackToy, NotationToy],
  queues: [QueueToy],
  recursion: [RecursionToy],
  trees: [TreeToy],
  graphs: [GraphToy],
};

export function StructureToy({ slug }: { slug: StructureSlug }) {
  const toys = TOYS[slug];
  if (!toys || toys.length === 0) return null;
  return (
    <div className="flex flex-col gap-3 pb-1 pl-6 pt-1">
      {toys.map((Toy, i) => (
        <Toy key={i} />
      ))}
    </div>
  );
}
