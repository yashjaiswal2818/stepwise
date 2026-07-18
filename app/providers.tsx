"use client";

import { MotionConfig } from "motion/react";
import { useProgressSync } from "@/engagement/useProgressSync";

/** App-wide motion config: honor the OS "reduce motion" setting for every
 *  Framer Motion animation (SVG transitions in globals.css already do the same).
 *  Also mounts progress sync, so a signed-in learner's solved problems and streak
 *  follow them across devices (anonymous users stay on localStorage). */
export function Providers({ children }: { children: React.ReactNode }) {
  useProgressSync();
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
