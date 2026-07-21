import Link from "next/link";
import { Logo } from "./landing/Logo";

export function Footer() {
  // Derived, not asserted. This used to be `© {2026}` — a literal wearing JSX
  // braces so it read as computed.
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line">
      {/* All of this is real text a reader is meant to read, so it sits at
          --fg-muted. --fg-faint measures 4.00:1 on --surface-3 and is reserved
          for decorative marks that are never the only route to information. */}
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-fg-muted sm:flex-row">
        <div className="flex items-center gap-2">
          <Logo />
          <span>· learn DSA one step at a time</span>
        </div>
        <div className="flex items-center gap-5">
          {/* A copyright line is not navigation, so it stays outside the nav. */}
          <nav aria-label="Footer" className="flex items-center gap-5">
            <Link
              href="/learn"
              className="rounded-sm transition-colors duration-[var(--duration-fast)] ease-out hover:text-fg"
            >
              Learn
            </Link>
            <Link
              href="/problems"
              className="rounded-sm transition-colors duration-[var(--duration-fast)] ease-out hover:text-fg"
            >
              Problems
            </Link>
          </nav>
          <span>© {year} Stepwise</span>
        </div>
      </div>
    </footer>
  );
}
