"use client";

import { useState } from "react";
import Image from "next/image";
import { AlertTriangle, LogIn, LogOut, UserCircle } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useProgress } from "@/engagement/useProgress";
import { useMounted } from "@/lib/useMounted";
import { Button } from "@/design-system/ui/Button";
import { cn } from "@/lib/utils";

/** Rounds in sync with the navbar: a full pill when the bar has condensed. */
const radiusTransition =
  "transition-[color,background-color,box-shadow,transform,border-radius] duration-[var(--duration-base)] ease-out";

/**
 * Sign in with GitHub / sign out. Reflects live session state via Better Auth's
 * reactive `useSession` hook. Signing in redirects to GitHub and back through
 * /api/auth/callback/github, landing on /learn.
 */
export function AuthButton({ condensed = false }: { condensed?: boolean } = {}) {
  const { data: session, isPending } = authClient.useSession();
  const mounted = useMounted();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const pill = condensed ? "rounded-full" : "rounded-md";

  /**
   * Signing out has to wipe local progress, and the order here is load-bearing.
   *
   * `useProgress` persists to localStorage, which is per-DEVICE, while progress
   * is per-USER. Left behind, the next person to sign in on this machine adopts
   * the previous user's solved[] and streak, and `useProgressSync` pushes that to
   * /api/progress — where `mergeProgress` unions solved[] and Math.max()es streak
   * into their rows. There is no inverse of that merge; the data is just gone.
   *
   * So: end the session FIRST. Every write in /api/progress is gated on
   * getCurrentUser(), so once the cookie is cleared the debounced push in
   * useProgressSync physically cannot reach the outgoing user's rows, and the
   * local wipe below cannot race it. If sign-out fails we keep the progress —
   * the user is still signed in and it is still theirs.
   */
  async function handleSignOut() {
    setBusy(true);
    setError(null);
    try {
      const res = await authClient.signOut();
      if (res.error) throw new Error(res.error.message ?? "Sign out failed");

      // reset() covers solved / lastActive / streak. `mode` is not part of it and
      // would still persist, so it is cleared back to the store's default here —
      // otherwise the next user on this device inherits this one's preference.
      useProgress.getState().reset();
      useProgress.setState({ mode: "beginner" });
    } catch {
      setError("Sign-out failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSignIn() {
    setBusy(true);
    setError(null);
    try {
      const res = await authClient.signIn.social({
        provider: "github",
        callbackURL: "/learn",
      });
      if (res.error) throw new Error(res.error.message ?? "Sign in failed");
      // On success the browser is already navigating to GitHub. `busy` stays set
      // so the control cannot be fired twice during the redirect.
    } catch {
      setError("Sign-in failed.");
      setBusy(false);
    }
  }

  /**
   * Loading: the session is still being resolved. Reserves the control's
   * footprint so the bar does not reflow when it arrives.
   *
   * `!mounted` is part of the condition, not decoration. The session lives only
   * in the browser, so the server always renders this skeleton — but Better
   * Auth's store can resolve synchronously from cache, so the first CLIENT
   * render was already drawing the signed-out button and every page in the app
   * threw a hydration mismatch on load. Gating on `useMounted` forces the server
   * HTML and the first client paint to agree; the real state swaps in after.
   */
  if (!mounted || isPending) {
    return (
      <div
        className={cn("h-9 w-24 animate-pulse bg-surface-2", radiusTransition, pill)}
        role="status"
        aria-label="Checking sign-in status"
      />
    );
  }

  if (session) {
    const label = session.user.name || session.user.email;
    const avatar = session.user.image;

    return (
      <div className="flex items-center gap-1.5">
        {/* The real GitHub avatar, with the icon as fallback for a user who has
            none and for an optimizer rejection. Empty alt: the name sits right
            next to it, so describing the image would just repeat the label. */}
        {avatar && !avatarFailed ? (
          <Image
            src={avatar}
            alt=""
            width={20}
            height={20}
            className="size-5 shrink-0 rounded-full border border-line object-cover"
            onError={() => setAvatarFailed(true)}
          />
        ) : (
          <UserCircle className="size-5 shrink-0 text-fg-muted" aria-hidden />
        )}
        <span className="hidden max-w-[12ch] truncate text-sm text-fg-muted sm:inline">
          {label}
        </span>

        <Button
          variant="ghost"
          size="sm"
          className={cn("size-9 p-0", radiusTransition, pill)}
          loading={busy}
          onClick={handleSignOut}
          aria-label="Sign out"
          title={error ? "Sign-out failed — try again" : "Sign out"}
        >
          <LogOut className="size-4" aria-hidden />
        </Button>

        <AuthError message={error} />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <Button variant="outline" size="sm" className={cn("h-9", radiusTransition, pill)} loading={busy} onClick={handleSignIn}>
        <LogIn className="size-4" aria-hidden />
        {/* Below sm the icon carries it visually, but the button still needs a
            name — so the word is hidden visually, not removed. */}
        <span className="hidden sm:inline">Sign in</span>
        <span className="sr-only sm:hidden">Sign in</span>
      </Button>

      <AuthError message={error} />
    </div>
  );
}

/**
 * There is no error hue in this system — chroma is spent entirely on algorithm
 * state — so a failure is carried by an icon plus words at full foreground
 * weight. The live region stays mounted even when empty, because announcing only
 * works if the container exists before the text is put into it.
 */
function AuthError({ message }: { message: string | null }) {
  return (
    <span
      aria-live="polite"
      className="flex items-center gap-1 text-xs font-medium text-fg"
    >
      {message ? (
        <>
          <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
          <span className="hidden sm:inline">{message}</span>
        </>
      ) : null}
    </span>
  );
}
