"use client";

import { useEffect, useState } from "react";

/** True only after the first client render — use to gate persisted/localStorage
 *  state so SSR and the first client paint agree. */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
