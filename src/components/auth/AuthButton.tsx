"use client";

import { LogIn, LogOut, UserCircle } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { buttonVariants } from "@/design-system/ui/Button";
import { cn } from "@/lib/utils";

/**
 * Sign in with GitHub / sign out. Reflects live session state via Better Auth's
 * reactive `useSession` hook. Signing in redirects to GitHub and back through
 * /api/auth/callback/github, landing on /learn.
 */
export function AuthButton() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <div className="h-8 w-24 animate-pulse rounded-xl bg-surface-2" aria-hidden />;
  }

  if (session) {
    const label = session.user.name || session.user.email;
    return (
      <div className="flex items-center gap-1.5">
        <span className="hidden items-center gap-1.5 text-sm text-fg-muted sm:flex">
          <UserCircle className="h-4 w-4" />
          <span className="max-w-[12ch] truncate">{label}</span>
        </span>
        <button
          type="button"
          onClick={() => authClient.signOut()}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => authClient.signIn.social({ provider: "github", callbackURL: "/learn" })}
      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
    >
      <LogIn className="h-4 w-4" />
      <span className="hidden sm:inline">Sign in</span>
    </button>
  );
}
