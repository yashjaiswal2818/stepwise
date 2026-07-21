"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Logo } from "./landing/Logo";
import { ThemeToggle } from "@/design-system/ui/ThemeToggle";
import { IconButton } from "@/design-system/ui/IconButton";
import { NavStreak } from "./engagement/NavStreak";
import { AuthButton } from "./auth/AuthButton";
import { buttonVariants } from "@/design-system/ui/Button";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/learn", label: "Learn" },
  { href: "/problems", label: "Problems" },
  { href: "/#structures", label: "Structures" },
];

/**
 * `usePathname` cannot see the fragment, so a hash link can never be proven
 * active — and marking "Structures" as current on every `/` visit would be state
 * that has gone stale, which is worse than no state at all. Hash links simply
 * never claim to be current.
 */
function isCurrent(pathname: string, href: string): boolean {
  if (href.includes("#")) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Active is elevation + border weight + type weight, never a tint: three channels
 * that all survive greyscale and colour-vision deficiency. `aria-current` carries
 * the same fact to assistive tech.
 */
function NavLink({
  href,
  current,
  onNavigate,
  className,
  children,
}: {
  href: string;
  current: boolean;
  onNavigate?: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      onClick={onNavigate}
      className={cn(
        // rounded-md is the 36px step on the radius scale; rounded-lg is the
        // card/panel step and reads as a blob at control size (see IconButton).
        "rounded-md border px-3 py-2 text-sm transition-colors duration-[var(--duration-fast)] ease-out",
        current
          ? "border-line-strong bg-surface-3 font-semibold text-fg"
          : "border-transparent font-medium text-fg-muted hover:bg-surface-2 hover:text-fg",
        className,
      )}
    >
      {children}
    </Link>
  );
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  // Close on route change, adjusted during render rather than in an effect: the
  // sheet is then already gone on the first paint of the new route instead of
  // flashing for a frame. The click handler on each link covers the one case
  // this cannot see — a hash link that leaves `pathname` untouched.
  const [routeWhenOpened, setRouteWhenOpened] = useState(pathname);
  if (routeWhenOpened !== pathname) {
    setRouteWhenOpened(pathname);
    setOpen(false);
  }

  // Modal behaviour: trap Tab inside the sheet, close on Escape, lock the page
  // behind it, and hand focus back to the trigger on the way out.
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;
    // Captured now, not read in cleanup: the trigger is a stable node, and
    // reading a ref during cleanup is a lint-flagged race.
    const trigger = triggerRef.current;

    const focusablesIn = () =>
      Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );

    focusablesIn()[0]?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab") return;

      const items = focusablesIn();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (event.shiftKey) {
        if (active === first || !panel!.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last || !panel!.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      trigger?.focus();
    };
  }, [open, close]);

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-base/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="rounded-lg" aria-label="Stepwise home">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} href={item.href} current={isCurrent(pathname, item.href)}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {/* Ambient chrome: your status and app settings. */}
          <NavStreak className="hidden sm:flex" />
          <ThemeToggle />

          {/* A hairline splits ambient chrome from identity + primary action, so
              the cluster reads as two groups instead of one undifferentiated run
              of chips. A hairline is the system's sanctioned separator. */}
          <span className="hidden h-5 w-px bg-line sm:block" aria-hidden />

          <AuthButton />
          {/* "Start learning" points at /learn, so it is noise on /learn itself and
              inside a problem/lesson — where it would be the highest-emphasis
              control in the app pointing at the page you are already on. */}
          {!pathname.startsWith("/learn") && !pathname.startsWith("/problem") && (
            <Link
              href="/learn"
              className={cn(buttonVariants({ size: "sm" }), "hidden h-9 rounded-md sm:inline-flex")}
            >
              Start learning
            </Link>
          )}

          <IconButton
            ref={triggerRef}
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls={panelId}
            aria-label={open ? "Close navigation menu" : "Open navigation menu"}
            className="md:hidden"
          >
            {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          </IconButton>
        </div>
      </div>

      {open && (
        <>
          {/* Scrim. Click-to-dismiss lives on the real backdrop, but Escape and
              the trigger are the keyboard routes out, so it stays aria-hidden.

              `absolute`, not `fixed`: the header's own backdrop-blur makes it a
              containing block for fixed descendants, so `fixed inset-x-0 top-16
              bottom-0` resolved against the 64px header and rendered 0px tall —
              an invisible scrim. Anchored to the header instead, `top-full` sits
              it directly below the bar and the height covers the rest of the
              viewport. */}
          <div
            className="absolute inset-x-0 top-full z-30 h-[calc(100dvh-4rem)] bg-base/80 backdrop-blur-sm md:hidden"
            onClick={close}
            aria-hidden
          />
          <div
            ref={panelRef}
            id={panelId}
            role="dialog"
            aria-modal="true"
            aria-label="Site navigation"
            className="absolute inset-x-0 top-full z-40 max-h-[calc(100dvh-4rem)] overflow-y-auto rounded-b-xl border-b border-line-strong bg-elevated px-5 pb-5 pt-3 shadow-[var(--shadow-modal)] md:hidden"
          >
            <nav aria-label="Main" className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  current={isCurrent(pathname, item.href)}
                  onNavigate={close}
                  className="text-md"
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="mt-4 flex flex-col gap-3 border-t border-line pt-4">
              {/* Desktop-only in the bar itself, which left a phone with no way
                  to reach it. This is that way. */}
              <NavStreak className="flex self-start" />
              <Link
                href="/learn"
                onClick={close}
                className={cn(buttonVariants({ size: "md" }), "w-full")}
              >
                Start learning
              </Link>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
