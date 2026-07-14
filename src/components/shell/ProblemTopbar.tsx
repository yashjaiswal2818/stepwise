import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Logo } from "../landing/Logo";
import { ThemeToggle } from "@/design-system/ui/ThemeToggle";
import { DifficultyTag, type Difficulty } from "@/design-system/ui/Badge";

export function ProblemTopbar({ title, difficulty }: { title: string; difficulty: Difficulty }) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line bg-surface px-3 sm:px-4">
      <Link
        href="/problems"
        className="flex items-center gap-1 rounded-lg py-1 pr-2 pl-1 text-sm text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
      >
        <ChevronLeft className="size-4" />
        <span className="hidden sm:inline">Problems</span>
      </Link>
      <div className="h-5 w-px bg-line" />
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="truncate font-medium text-fg">{title}</span>
        <DifficultyTag level={difficulty} />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Link href="/" className="hidden rounded-lg px-1 sm:block" aria-label="Home">
          <Logo withText={false} />
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
