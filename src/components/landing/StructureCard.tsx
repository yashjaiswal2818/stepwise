"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import type { CSSProperties } from "react";
import type { Structure } from "@/curriculum/structures";
import { StructurePreview } from "./previews";
import { EASE_OUT } from "@/engine/canvas/motion";

export function StructureCard({ s, index }: { s: Structure; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: (index % 4) * 0.06, ease: EASE_OUT }}
      style={{ "--card": s.accent } as CSSProperties}
    >
      <Link
        href={s.href}
        className="group relative flex h-full flex-col overflow-hidden rounded-lg border border-line bg-surface p-1.5 shadow-[var(--lift)] transition-all duration-[var(--duration-base)] hover:-translate-y-1 hover:border-line-strong hover:shadow-[var(--shadow-pop)]"
      >
        <div className="bg-rule relative h-[132px] overflow-hidden rounded-md border border-line bg-elevated">
          <StructurePreview slug={s.slug} />
        </div>
        <div className="relative flex flex-1 flex-col p-3.5">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full" style={{ background: "var(--card)" }} />
            <h3 className="text-md font-semibold text-fg">{s.title}</h3>
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{s.blurb}</p>
          <div className="mt-3 flex items-center gap-1.5 text-sm font-medium text-fg-faint transition-colors group-hover:text-fg">
            Try {s.tryLabel}
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
