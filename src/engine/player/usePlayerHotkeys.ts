"use client";

import { useEffect } from "react";
import { usePlayer } from "./store";

function isTypingTarget(el: EventTarget | null): boolean {
  const t = el as HTMLElement | null;
  return !!t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
}

/** Global playback shortcuts: Space, ←/→, +/-, r, Home/End.
 *  While a predict-gate is open the map changes: digits answer, Esc skips,
 *  ← steps back (closing the gate unresolved), Enter/Space continue a resolved
 *  gate — and everything else is inert so the transport cannot drive past an
 *  open question. Handled HERE, not only on the gate's focused container, so
 *  the keyboard contract survives focus wandering to the canvas. */
export function usePlayerHotkeys() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target) || e.metaKey || e.ctrlKey) return;
      const p = usePlayer.getState();
      if (p.gate) {
        if (p.gate.phase === "open" && e.key >= "1" && e.key <= "9") {
          const k = Number(e.key) - 1;
          if (k < p.gate.ask.options.length) {
            e.preventDefault();
            p.answerGate(k);
          }
        } else if (e.key === "Escape" && p.gate.phase === "open") {
          e.preventDefault();
          p.skipGate();
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          p.prev();
        } else if ((e.key === "Enter" || e.key === " ") && p.gate.phase === "resolved") {
          e.preventDefault();
          p.closeGate();
        } else if (e.key === " " || e.key === "ArrowRight" || e.key === "Home" || e.key === "End") {
          e.preventDefault(); // inert while the question is open
        }
        return;
      }
      switch (e.key) {
        case " ":
          e.preventDefault();
          p.toggle();
          break;
        case "ArrowRight":
          e.preventDefault();
          p.stepForward();
          break;
        case "ArrowLeft":
          e.preventDefault();
          p.prev();
          break;
        case "+":
        case "=":
          p.setSpeed(p.speed + 0.5);
          break;
        case "-":
        case "_":
          p.setSpeed(p.speed - 0.5);
          break;
        case "r":
        case "R":
          p.reset();
          break;
        case "Home":
          e.preventDefault();
          p.seek(0);
          break;
        case "End":
          e.preventDefault();
          p.seek((p.trace?.steps.length ?? 1) - 1);
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
