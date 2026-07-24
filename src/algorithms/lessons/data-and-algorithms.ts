import type { Trace } from "@/engine/types";
import { ArrayTracer } from "../authoring/ArrayTracer";

/**
 * SOURCE is authored so every prefix is a program you could actually run — the
 * lessons/arrays.ts discipline. The loop (lines 5-7) appears as one unit so a
 * dangling brace is never on screen across a dwell.
 */
export const SOURCE = `const cards = [17, 42, 9];

let best = cards[0];

for (let i = 1; i < cards.length; i++) {
  if (cards[i] > best) best = cards[i];
}

best;   // 42 — the champion`;

/** 1-based line anchors — co-located with SOURCE so drift is easy to catch. */
const L = {
  data: 1,
  champ: 3,
  loop: 5,
  test: 6,
  close: 7,
  answer: 9,
} as const;

const CARDS = [17, 42, 9];

/**
 * "Data and instructions" — Foundations unit 1. The champion loop over three
 * numbers: the smallest real program that separates data (the stuff) from
 * algorithm (the steps), and shows that the machine's entire working memory is
 * one remembered number. The `values` arg is ignored; datasets are chapters,
 * not inputs.
 */
export function dataAndAlgorithmsTrace(_values: (number | string)[], datasetId = "default"): Trace {
  const t = new ArrayTracer(CARDS);

  t.written(1);
  t.note(
    "Here are three numbers. You take them in at a glance. A computer cannot — it looks at exactly one thing at a time, and everything in this course follows from that constraint.",
    L.data,
    "init",
  );
  t.note(
    "A program is two things. The data — the stuff, these numbers. And the algorithm — the steps to follow, written so exactly that nothing is left to judgment.",
    L.data,
    "init",
  );

  // The champion loop, run for real — every branch below reads the tracer's own
  // cells, so the picture cannot drift from the algorithm.
  t.written(3);
  let best = 0; // index of the current champion
  t.mark([best], "active", { hold: true }).setPointer("best", best).setVar("best", t.value(best));
  t.note(
    `Step one: look at the first number and call it the champion. ${t.value(best)} holds the title — of the one number we have seen.`,
    L.champ,
    "visit",
    "A reader that sees one thing at a time can only ever hold “biggest so far” — the algorithm's entire memory is one title-holder.",
  );

  t.written(7);
  for (let i = 1; i < t.length; i++) {
    t.setPointer("i", i).setVar("i", i);
    if (t.greater(i, best)) {
      t.compare(i, best, L.test, `Look at the next number: ${t.value(i)}. Is it bigger than the champion, ${t.value(best)}?`);
      t.release([best]);
      const old = t.value(best);
      best = i;
      t.mark([best], "active", { hold: true }).setPointer("best", best).setVar("best", t.value(best));
      t.note(
        `Yes — the title changes hands. ${t.value(best)} is the new champion. Notice we remembered exactly one number, not the whole list.`,
        L.test,
        "set",
        `Anything that later beats ${t.value(best)} would have beaten ${old} too — replacing, not accumulating, is what keeps the memory at exactly one number.`,
      );
    } else {
      t.compare(
        i,
        best,
        L.test,
        `${t.value(i)} against ${t.value(best)} — no. The champion holds.`,
        `${t.value(i)} lost to the title-holder, and the title-holder already absorbed every earlier loser — one comparison settles ${t.value(i)} against the whole list so far.`,
      );
    }
  }

  t.clearPointer("i").clearVar("i");
  t.release([best]);
  t.written(9);
  t.markFinal(
    best,
    L.answer,
    `Out of numbers. The last champion standing is the answer: ${t.value(best)}.`,
    "With nothing left to look at, “biggest so far” quietly becomes “biggest, full stop” — the loop never saw the whole list at once; it only outlasted it.",
  );

  t.note(
    "Read the steps back. Look. Compare. Remember one thing. Not one of them is clever — the intelligence is entirely in their order.",
    [L.champ, L.loop, L.test],
    "init",
  );
  t.note(
    "And the same steps work unchanged on three numbers or three million. That is what makes this an algorithm and not an answer.",
    L.loop,
    "init",
    "The steps never name 17 or 42 — they say “the next number”, and “next” exists at any length. Only the running time grows, never the instructions.",
  );

  t.ask({
    id: "champion-after-two",
    prompt: "Run the same steps on [8, 3, 12]. Who is the champion after step two?",
    options: [
      {
        text: "8",
        why: "3 is not bigger than 8, so the title does not change hands. The champion only moves when it is beaten — that single rule is the whole algorithm.",
      },
      {
        text: "3",
        why: "3 is the number being looked at, not the number being kept. Looking is not winning — 3 lost its comparison, so the title stayed where it was.",
      },
      {
        text: "12",
        why: "12 does win in the end — but by step two the machine has not looked at it yet, and an algorithm only knows what it has already seen.",
      },
    ],
    answerIndex: 0,
  });
  // Close on prose, not colour — the answer cell keeps its mark; nothing else
  // needs asserting.
  t.note(
    "Data is what you have. An algorithm is what you do to it, one dumb step at a time. Next: where the data actually sits.",
    L.data,
    "done",
  );

  return t.build({
    exampleId: "lesson-data-and-algorithms",
    title: "Data and instructions",
    code: SOURCE,
    language: "ts",
    // No `sources`: a first lesson does not offer a C/Python toggle.
    datasetId,
    legend: ["active", "compare", "final"],
  });
}
