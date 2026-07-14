import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function IconButton({ className, ...props }: ComponentProps<"button">) {
  return (
    <button
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-lg text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg active:scale-95 disabled:opacity-40 disabled:pointer-events-none",
        className,
      )}
      {...props}
    />
  );
}
