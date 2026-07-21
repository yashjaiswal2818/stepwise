"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { Menu, X } from "lucide-react";
import { Logo } from "./landing/Logo";
import { ThemeToggle } from "@/design-system/ui/ThemeToggle";
import { IconButton } from "@/design-system/ui/IconButton";
import { NavStreak } from "./engagement/NavStreak";
import { AuthButton } from "./auth/AuthButton";
import { buttonVariants } from "@/design-system/ui/Button";
import { DUR, EASE_OUT } from "@/engine/canvas/motion";
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
 * that has gone stale, which is worse than no state at all.
 */
function isCurrent(pathname: string, href: string): boolean {
  if (href.includes("#")) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  // Close on route change, adjusted during render so the sheet is gone on the
  // first paint of the new route instead of flashing for a frame.
  const [routeWhenOpened, setRouteWhenOpened] = useState(pathname);
  if (routeWhenOpened !== pathname) {
    setRouteWhenOpened(pathname);
    setOpen(false);
  }

  // Scroll-aware: past a few pixels the bar condenses into a floating, elevated
  // pill. The header keeps a CONSTANT height (h-16) and the bar animates INSIDE
  // it, so nothing below the header ever reflows — no scroll jank.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Modal behaviour for the mobile sheet: trap Tab, close on Escape, lock the
  // page behind it, hand focus back to the trigger on the way out.
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;
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

  const showCta = !pathname.startsWith("/learn") && !pathname.startsWith("/problem");
  // The sliding indicator sits under the hovered item, or the current route when
  // nothing is hovered — one element with a shared layoutId, so it glides.
  const activeHref = hovered ?? NAV_ITEMS.find((i) => isCurrent(pathname, i.href))?.href ?? null;
  // When the sheet is open the bar returns to its full, stable shape so the
  // dropdown anchors cleanly to a full-width bar rather than a floating pill.
  const condensed = scrolled && !open;

  return (
    <header className="sticky top-0 z-40 h-16 px-3">
      <div
        className={cn(
          "relative mx-auto flex items-center justify-between gap-3 transition-all duration-[var(--duration-base)] ease-out",
          condensed
            ? "mt-2 h-12 max-w-4xl rounded-full border border-line bg-elevated/85 pl-4 pr-2.5 shadow-[var(--shadow-pop)] backdrop-blur-md"
            : "h-16 max-w-6xl border-b border-line/70 bg-base/90 px-4 backdrop-blur-sm",
        )}
      >
        <Link href="/" className="shrink-0 rounded-lg" aria-label="Stepwise home">
          <Logo />
        </Link>

        <nav
          className="relative hidden items-center md:flex"
          aria-label="Main"
          onMouseLeave={() => setHovered(null)}
        >
          {NAV_ITEMS.map((item) => {
            const current = isCurrent(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={current ? "page" : undefined}
                onMouseEnter={() => setHovered(item.href)}
                className={cn(
                  "relative rounded-md px-3.5 py-2 text-sm transition-colors duration-[var(--duration-fast)] ease-out",
                  current ? "font-semibold text-fg" : "font-medium text-fg-muted hover:text-fg",
                )}
              >
                {activeHref === item.href && (
                  <motion.span
                    layoutId="nav-indicator"
                    className="absolute inset-0 rounded-md bg-surface-2"
                    transition={{ type: "tween", duration: DUR.base, ease: EASE_OUT }}
                  />
                )}
                <span className="relative">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          {/* Ambient chrome: your status and app settings. */}
          <NavStreak className="hidden sm:flex" />
          <ThemeToggle />

          {/* A hairline splits ambient chrome from identity + primary action. */}
          <span className="hidden h-5 w-px bg-line sm:block" aria-hidden />

          <AuthButton condensed={condensed} />
          {/* "Start learning" points at /learn, so it is hidden there and inside a
              problem/lesson, where it would point at the page you are already on.
              Its radius follows the bar — rounding to a full pill as the navbar
              condenses, on the same duration so the two move together. */}
          {showCta && (
            <Link
              href="/learn"
              className={cn(
                buttonVariants({ size: "sm" }),
                "hidden h-9 sm:inline-flex",
                "transition-[color,background-color,box-shadow,transform,border-radius] duration-[var(--duration-base)] ease-out",
                condensed ? "rounded-full" : "rounded-md",
              )}
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

        {open && (
          <>
            {/* Scrim below the bar. Escape and the trigger are the keyboard routes
                out, so it stays aria-hidden. Anchored to the bar (top-full). */}
            <div
              className="absolute inset-x-0 top-full z-30 mt-1 h-[calc(100dvh-4.5rem)] bg-base/80 backdrop-blur-sm md:hidden"
              onClick={close}
              aria-hidden
            />
            <div
              ref={panelRef}
              id={panelId}
              role="dialog"
              aria-modal="true"
              aria-label="Site navigation"
              className="absolute inset-x-0 top-full z-40 mt-1 max-h-[calc(100dvh-4.5rem)] overflow-y-auto rounded-xl border border-line-strong bg-elevated p-3 shadow-[var(--shadow-modal)] md:hidden"
            >
              <nav aria-label="Main" className="flex flex-col gap-1">
                {NAV_ITEMS.map((item) => {
                  const current = isCurrent(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={current ? "page" : undefined}
                      onClick={close}
                      className={cn(
                        "rounded-md px-3 py-2.5 text-md transition-colors duration-[var(--duration-fast)] ease-out",
                        current
                          ? "bg-surface-3 font-semibold text-fg"
                          : "font-medium text-fg-muted hover:bg-surface-2 hover:text-fg",
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-3 flex flex-col gap-3 border-t border-line pt-3">
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
      </div>
    </header>
  );
}
