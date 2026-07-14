"use client";

import { useEffect } from "react";
import { usePlayer } from "./store";

function isTypingTarget(el: EventTarget | null): boolean {
  const t = el as HTMLElement | null;
  return !!t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
}

/** Global playback shortcuts: Space, ←/→, +/-, r, Home/End. */
export function usePlayerHotkeys() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target) || e.metaKey || e.ctrlKey) return;
      const p = usePlayer.getState();
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
