"use client";

import { MotionConfig } from "motion/react";

/** App-wide motion config: honor the OS "reduce motion" setting for every
 *  Framer Motion animation (SVG transitions in globals.css already do the same). */
export function Providers({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
