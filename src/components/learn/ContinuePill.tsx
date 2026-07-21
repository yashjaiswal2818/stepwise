"use client";

import { useEffect, useState, type RefObject } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Play } from "lucide-react";
import { buttonVariants } from "@/design-system/ui/Button";
import { DUR, EASE_OUT } from "@/engine/canvas/motion";
import { cn } from "@/lib/utils";

/**
 * A floating Continue control that appears only once the resume lead has scrolled
 * out of view — so jump-back-in stays one tap away without a permanent heavy
 * header. Returning learners only (rendered by the parent behind a lastVisited
 * check). A genuinely floating layer, so a drop shadow is legal here.
 */
export function ContinuePill({
  href,
  sentinelRef,
}: {
  href: string;
  sentinelRef: RefObject<HTMLElement | null>;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setShow(!entry.isIntersecting), {
      rootMargin: "-8px 0px 0px 0px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, [sentinelRef]);

  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DUR.base, ease: EASE_OUT }}
      className="fixed inset-x-5 bottom-4 z-30 sm:inset-x-auto sm:bottom-6 sm:right-6"
    >
      <Link
        href={href}
        className={cn(
          buttonVariants({ variant: "primary", size: "sm" }),
          "w-full justify-center shadow-[var(--shadow-pop)] sm:w-auto",
        )}
      >
        <Play className="size-3.5 shrink-0" aria-hidden />
        Continue
      </Link>
    </motion.div>
  );
}
