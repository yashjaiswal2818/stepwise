"use client";

import { useEffect } from "react";
import { usePlayer } from "./store";

/**
 * Drives auto-play on requestAnimationFrame (outside React render) — smoother
 * than setInterval, auto-throttles in background tabs, and honors speed changes
 * on the next frame. Mount once (in the workspace).
 */
export function usePlaybackLoop() {
  const isPlaying = usePlayer((s) => s.isPlaying);
  const speed = usePlayer((s) => s.speed);

  useEffect(() => {
    if (!isPlaying) return;
    let raf = 0;
    let acc = 0;
    let prev = performance.now();

    const tick = (now: number) => {
      acc += now - prev;
      prev = now;
      const interval = 1000 / speed;
      while (acc >= interval) {
        usePlayer.getState().next();
        acc -= interval;
        if (!usePlayer.getState().isPlaying) break; // auto-paused at the end
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, speed]);
}
