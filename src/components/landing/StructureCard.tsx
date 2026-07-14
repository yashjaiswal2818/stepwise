"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import type { CSSProperties } from "react";
import type { Structure } from "@/curriculum/structures";
import { StructurePreview } from "./previews";

export function StructureCard({ s, index }: { s: Structure; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: (index % 4) * 0.06, ease: [0.22, 1, 0.36, 1] }}
      style={{ "--accent": s.accent } as CSSProperties}
    >
      <Link
        href={s.href}
        className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface p-1.5 transition-all duration-300 hover:-translate-y-1 hover:border-line-strong hover:shadow-[var(--shadow-lg)]"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(120% 80% at 50% -10%, color-mix(in oklab, var(--accent) 15%, transparent), transparent 60%)",
          }}
        />
        <div className="bg-grid relative h-[132px] overflow-hidden rounded-xl border border-line bg-elevated">
          <StructurePreview slug={s.slug} />
        </div>
        <div className="relative flex flex-1 flex-col p-3.5">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full" style={{ background: "var(--accent)" }} />
            <h3 className="text-[15px] font-semibold text-fg">{s.title}</h3>
          </div>
          <p className="mt-1.5 text-[13px] leading-relaxed text-fg-muted">{s.blurb}</p>
          <div className="mt-3 flex items-center gap-1.5 text-[13px] font-medium text-fg-faint transition-colors group-hover:text-[var(--accent)]">
            Try {s.tryLabel}
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
