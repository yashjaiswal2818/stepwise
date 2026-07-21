import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { interactive } from "./interaction";

/**
 * A square, label-less button. Because it has no visible text, every call site
 * must pass an `aria-label` — that is not enforceable in the type system
 * without making the common case awkward, so it is a review item.
 *
 * Press depth, disabled treatment and transition timing come from
 * `interaction.ts`, shared with Button, so the two cannot drift apart again.
 */
export function IconButton({
  type = "button",
  className,
  ...props
}: ComponentProps<"button">) {
  return (
    <button
      type={type}
      className={cn(
        /* size-9 is a 36px control, so rounded-md (7px) is its step on the
           radius scale — rounded-lg is the card/panel step and reads as a
           blob at this size. */
        "inline-flex size-9 items-center justify-center rounded-md",
        "text-fg-muted hover:bg-surface-2 hover:text-fg",
        interactive,
        className,
      )}
      {...props}
    />
  );
}
