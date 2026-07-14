import Link from "next/link";
import { Logo } from "./landing/Logo";

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-fg-faint sm:flex-row">
        <div className="flex items-center gap-2">
          <Logo />
          <span className="text-fg-faint">· learn DSA one step at a time</span>
        </div>
        <div className="flex items-center gap-5">
          <Link href="/learn" className="transition-colors hover:text-fg">Learn</Link>
          <Link href="/problems" className="transition-colors hover:text-fg">Problems</Link>
          <span>© {2026} Stepwise</span>
        </div>
      </div>
    </footer>
  );
}
