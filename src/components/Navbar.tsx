import Link from "next/link";
import { Logo } from "./landing/Logo";
import { ThemeToggle } from "@/design-system/ui/ThemeToggle";
import { NavStreak } from "./engagement/NavStreak";
import { ModeToggle } from "./engagement/ModeToggle";
import { buttonVariants } from "@/design-system/ui/Button";
import { cn } from "@/lib/utils";

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-lg px-3 py-2 text-sm font-medium text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
    >
      {children}
    </Link>
  );
}

export function Navbar() {
  return (
    <header className="glass sticky top-0 z-40 border-b border-line/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="rounded-lg" aria-label="Stepwise home">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          <NavLink href="/learn">Learn</NavLink>
          <NavLink href="/problems">Problems</NavLink>
          <NavLink href="/#structures">Structures</NavLink>
        </nav>
        <div className="flex items-center gap-2">
          <ModeToggle />
          <NavStreak />
          <ThemeToggle />
          <Link
            href="/learn"
            className={cn(buttonVariants({ size: "sm" }), "hidden sm:inline-flex")}
          >
            Start learning
          </Link>
        </div>
      </div>
    </header>
  );
}
