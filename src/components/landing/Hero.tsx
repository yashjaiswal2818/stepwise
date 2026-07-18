"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Sparkles, ArrowRight } from "lucide-react";
import { HeroPreview } from "./HeroPreview";
import { buttonVariants } from "@/design-system/ui/Button";
import { cn } from "@/lib/utils";

const fade = (d = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay: d, ease: [0.22, 1, 0.36, 1] as const },
});

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 top-[-10%] -z-10 h-[520px]"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 0%, color-mix(in oklab, var(--brand) 22%, transparent), transparent 70%)",
        }}
      />
      <div className="bg-grid pointer-events-none absolute inset-0 -z-10 opacity-40 [mask-image:radial-gradient(70%_50%_at_50%_0%,black,transparent)]" />

      <div className="mx-auto max-w-5xl px-5 pt-16 pb-12 text-center sm:pt-24">
       
        <motion.h1
          {...fade(0.06)}
          className="mt-5 text-balance text-4xl font-semibold tracking-tight text-fg sm:text-6xl"
        >
          Master data structures,
          <br className="hidden sm:block" /> one <span className="text-gradient">step</span> at a time.
        </motion.h1>
        <motion.p
          {...fade(0.12)}
          className="mx-auto mt-5 max-w-xl text-pretty text-base leading-relaxed text-fg-muted sm:text-lg"
        >
          Stepwise turns every algorithm into a beautiful, interactive visualization. Pause, step
          forward, and actually see what&apos;s happening — build intuition instead of memorizing.
        </motion.p>
        <motion.div {...fade(0.18)} className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/learn" className={cn(buttonVariants({ size: "lg" }))}>
            Start learning <ArrowRight className="size-4" />
          </Link>
          <Link href="/problems" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
            Explore problems
          </Link>
        </motion.div>
        <motion.p {...fade(0.24)} className="mt-6 font-mono text-xs text-fg-faint">
          step controls · state highlighting · 15+ curated problems
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-4xl px-5 pb-10"
      >
        <HeroPreview />
      </motion.div>
    </section>
  );
}
