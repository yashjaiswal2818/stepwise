"use client";

import { useEffect, useRef } from "react";
import { authClient } from "@/lib/auth-client";
import { useProgress } from "./useProgress";

interface Snapshot {
  solved: string[];
  streak: number;
  lastActiveDay: string | null;
  mode: "beginner" | "interview";
}

function snapshot(): Snapshot {
  const s = useProgress.getState();
  return { solved: s.solved, streak: s.streak, lastActiveDay: s.lastActive, mode: s.mode };
}

async function push(snap: Snapshot): Promise<void> {
  try {
    await fetch("/api/progress", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(snap),
    });
  } catch {
    /* progress sync is best-effort — local state is still correct */
  }
}

/**
 * Keeps the local progress store (localStorage) in sync with the server for
 * signed-in users, so solved problems and streaks follow them across devices.
 *
 * Two phases: adopt the server's state once on sign-in (merged with whatever is
 * already local, so progress earned while signed out isn't lost), then push
 * subsequent local changes on a debounce. Anonymous users are untouched — they
 * keep working purely from localStorage.
 */
export function useProgressSync(): void {
  const { data: session, isPending } = authClient.useSession();
  const adopted = useRef(false);

  // Phase 1 — adopt server progress (merged with local) once per sign-in.
  useEffect(() => {
    if (isPending || !session || adopted.current) return;
    adopted.current = true;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/progress");
        const { progress } = (await res.json()) as { progress: Snapshot | null };
        if (cancelled || !progress) return;

        const local = useProgress.getState();
        useProgress.setState({
          solved: Array.from(new Set([...local.solved, ...progress.solved])),
          streak: Math.max(local.streak, progress.streak),
          // YYYY-MM-DD sorts lexicographically — the max string is the later day.
          lastActive:
            [local.lastActive, progress.lastActiveDay].filter(Boolean).sort().pop() ?? null,
          mode: progress.mode ?? local.mode,
        });
        // The store change below triggers the debounced push, which writes the
        // merged result back — no explicit push needed here.
      } catch {
        /* server progress is optional; local state stands */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session, isPending]);

  // Reset the adopt latch on sign-out so a later sign-in re-syncs.
  useEffect(() => {
    if (!isPending && !session) adopted.current = false;
  }, [session, isPending]);

  // Phase 2 — push local changes, debounced so a burst of updates is one write.
  useEffect(() => {
    if (!session) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = useProgress.subscribe(() => {
      clearTimeout(timer);
      timer = setTimeout(() => void push(snapshot()), 800);
    });
    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [session]);
}
