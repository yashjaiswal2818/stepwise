"use client";

import { useSyncExternalStore } from "react";

/** Nothing to subscribe to — the value flips once, at hydration. */
const neverChanges = () => () => {};

/** True only after the first client render — use to gate persisted/localStorage
 *  state so SSR and the first client paint agree.
 *
 *  Implemented with useSyncExternalStore rather than an effect: the server
 *  snapshot is `false` and the client snapshot is `true`, so React resolves the
 *  difference during hydration instead of via a cascading setState-in-effect. */
export function useMounted(): boolean {
  return useSyncExternalStore(
    neverChanges,
    () => true,
    () => false,
  );
}
