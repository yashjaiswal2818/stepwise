import type { Trace } from "@/engine/types";
import { ListTracer } from "../authoring/ListTracer";

/**
 * SOURCE is authored so every prefix is a program you could actually run. The
 * comments carry the lesson's model — in JS these are references, but the box
 * on screen shows the address, so the comments narrate what the machine does.
 */
export const SOURCE = `const first  = { value: 7,  next: null };   // the box at 3200
const second = { value: 13, next: null };   // the box at 3600

let a = first;       // a holds 3200 — an address, not a copy

first.next = second; // write 3600 into the next cell

let b = second;      // b holds 3600 too — two roads, one box

b.value = 99;        // write through b…
a.next.value;        // …read through a: 99. The same box.

a.next = null;       // erase the road — the box remains`;

/** 1-based line anchors — co-located with SOURCE so drift is easy to catch. */
const L = {
  boxes: 1,
  box2: 2,
  varA: 4,
  wire: 6,
  varB: 8,
  write: 10,
  read: 11,
  erase: 13,
} as const;

/** Synthetic but matching — the ListView convention (ListView.tsx renders
 *  `3200 + i * 400` under every node), computed here so every address the
 *  narration quotes is the one on screen. */
const ADDR = (i: number) => 3200 + i * 400;

/**
 * "Boxes and arrows" — Foundations unit 3. Two boxes, two variables, one
 * aliasing beat that is SHOWN: the value changes through `b` and is read back
 * through `a`'s arrow on the same visibly-changed box. Dangling pointers stay
 * out (toy-only — ListTracer cannot free a node, and this lesson never needs
 * to). The `values` arg is ignored; datasets are chapters, not inputs.
 */
export function pointersTrace(_values: (number | string)[], datasetId = "default"): Trace {
  const t = new ListTracer([7, 13]);
  const first = t.id(0);
  const second = t.id(1);

  // The constructor wires n0 → n1; this lesson earns that arrow on screen, so
  // start with no links at all.
  t.rewire(first, null);

  t.written(2);
  t.step(
    "Two boxes in memory. One holds 7, the other 13. Under each box: its address — where in memory it lives. Nothing points at anything yet.",
    [L.boxes, L.box2],
    "init",
  );

  t.written(4);
  t.setPointer("a", first).setVars({ a: ADDR(0) });
  t.step(
    `A variable, a. What it holds is just a number: ${ADDR(0)}. Read that number, then find it under a box — a is aimed at the first box.`,
    L.varA,
    "set",
    "A variable's cell is one value wide — a whole box does not fit, but the box's address does. Holding the address is how something small can hold something big.",
  );

  t.nodeState(first, "active");
  t.step(
    "Look inside the box: two cells. The left holds its value, 7. The right is the next cell — it reads NULL: an address-sized slot with no address written in it yet.",
    [L.boxes, L.box2],
    "init",
  );

  t.written(6);
  t.rewire(first, second).edge(first, "active");
  t.step(
    `Write ${ADDR(1)} into the first box's next cell. An arrow appears — but what was stored is only a number: the second box's address.`,
    L.wire,
    "set",
    "The arrow is a drawing; the number is the data. Nothing moved and nothing was copied — one cell now names a place, and that is the entire mechanism.",
  );

  t.written(8);
  t.setPointer("b", second).setVars({ b: ADDR(1) });
  t.step(
    `A second variable, b, holding ${ADDR(1)}. Count what points at the second box now: b, and the first box's next cell. Two arrows, one box.`,
    L.varB,
    "set",
    `Copying a pointer copies the address, never the box — ${ADDR(1)} written in two places is still one place, named twice.`,
  );

  // ---- the aliasing beat: change it through b, read it through a ----
  t.written(10);
  t.setValue(second, 99).nodeState(second, "swap");
  t.step(
    `Change the value through b: walk to ${ADDR(1)}, write 99. The box that held 13 now holds ${t.valueOf(second)} — the same box the first box's arrow lands on.`,
    L.write,
    "set",
    "b has no value of its own to change — the write has nowhere to land except the one box at 3600, whoever else happens to be pointing at it.",
  );

  t.written(11);
  t.edge(first, "active").nodeState(second, "active");
  t.step(
    `Now read through a: a leads to the first box, its arrow leads to ${ADDR(1)} — and the value there is ${t.valueOf(second)}. The change b made is simply there.`,
    L.read,
    "visit",
    "a and b never exchanged anything — both roads end at the same address, so there is no second copy to update and nothing to keep in sync.",
  );

  t.written(13);
  t.rewire(first, null);
  t.step(
    `Erase the first box's next cell — write NULL over the address. The arrow vanishes. The box at ${ADDR(1)} still exists, value ${t.valueOf(second)} and all; this road to it is gone.`,
    L.erase,
    "set",
    `Overwriting a pointer destroys a route, never a destination — b still holds ${ADDR(1)}, so the box is one road poorer and otherwise untouched.`,
  );

  t.step(
    "Everything a linked list, a tree, or a graph does is this one move: store an address, follow it, or overwrite it.",
    [L.wire, L.read, L.erase],
    "init",
  );

  t.ask({
    id: "pointers-aliasing",
    prompt: "Two variables hold the same address, 3600. The value there is changed through the first. What does reading through the second see?",
    options: [
      {
        text: "The old value",
        why: "That would take two boxes. A variable holding an address stores no value of its own, so there is no private copy anywhere for the old value to survive in.",
      },
      {
        text: "The new value",
        why: "Both variables are roads to the same box, and a box has exactly one value: whatever was last written. Any road you take arrives at it.",
      },
      {
        text: "Nothing — the second variable broke",
        why: "The write changed the box's contents, not its address. 3600 still names the same live box, so every variable holding 3600 still works.",
      },
    ],
    answerIndex: 1,
  });
  t.step(
    "A variable can hold a value — or the address of one. When you can read an arrow as a number, reversal, cycles, and trees stop being magic.",
    L.varA,
    "done",
  );

  return t.build({
    exampleId: "lesson-pointers",
    title: "Boxes and arrows",
    code: SOURCE,
    language: "ts",
    // No `sources`: a first lesson does not offer a C/Python toggle.
    datasetId,
    legend: ["active", "swap"],
  });
}
