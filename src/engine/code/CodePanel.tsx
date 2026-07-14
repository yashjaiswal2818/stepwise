"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { usePlayer } from "../player/store";
import { tokenizeLines, type TokenClass } from "./highlight";
import type { Lang } from "@/engine/types";
import { cn } from "@/lib/utils";

const EMPTY: number[] = [];

const COL: Record<TokenClass, string> = {
  kw: "var(--code-kw)",
  fn: "var(--code-fn)",
  num: "var(--code-num)",
  str: "var(--code-str)",
  com: "var(--code-com)",
  punct: "var(--code-punct)",
  var: "var(--code-var)",
  ws: "inherit",
};

const LABEL: Record<Lang, string> = { js: "JS", py: "Python", c: "C" };

export function CodePanel() {
  const trace = usePlayer((s) => s.trace);
  const activeJs = usePlayer((s) => s.trace?.steps[s.index]?.codeLines ?? EMPTY);
  const [lang, setLang] = useState<Lang>("js");

  useEffect(() => {
    try {
      const fromUrl = new URLSearchParams(window.location.search).get("lang") as Lang | null;
      const saved = fromUrl ?? (localStorage.getItem("stepwise-lang") as Lang | null);
      if (saved === "js" || saved === "py" || saved === "c") setLang(saved);
    } catch {}
  }, []);

  const available: Lang[] = ["js"];
  if (trace?.sources?.py) available.push("py");
  if (trace?.sources?.c) available.push("c");
  const activeLang = available.includes(lang) ? lang : "js";

  const code =
    activeLang === "js" ? trace?.code ?? "" : trace?.sources?.[activeLang]?.code ?? trace?.code ?? "";
  const lines = useMemo(() => tokenizeLines(code, activeLang), [code, activeLang]);

  const active =
    activeLang === "js"
      ? activeJs
      : activeJs
          .map((n) => trace?.sources?.[activeLang]?.map[n])
          .filter((x): x is number => x != null);
  const activeSet = new Set(active);
  const firstActive = active.length ? Math.min(...active) : -1;

  function pick(l: Lang) {
    setLang(l);
    try {
      localStorage.setItem("stepwise-lang", l);
    } catch {}
  }

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-elevated">
      {available.length > 1 && (
        <div className="flex items-center gap-1 border-b border-line px-2 py-1.5">
          {available.map((l) => (
            <button
              key={l}
              onClick={() => pick(l)}
              className={cn(
                "rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors",
                activeLang === l ? "bg-brand-soft text-brand-strong" : "text-fg-muted hover:bg-surface-2 hover:text-fg",
              )}
            >
              {LABEL[l]}
            </button>
          ))}
        </div>
      )}
      <div className="overflow-x-auto py-2.5 font-mono text-[13px] leading-[1.75]">
        {lines.map((toks, idx) => {
          const n = idx + 1;
          const on = activeSet.has(n);
          return (
            <div key={idx} className={cn("relative flex gap-3 px-3", on && "bg-brand-soft")}>
              {n === firstActive && (
                <motion.span
                  layoutId="code-cursor"
                  className="absolute inset-y-0 left-0 w-[2.5px] bg-brand"
                  transition={{ type: "spring", stiffness: 600, damping: 44 }}
                />
              )}
              <span className="w-6 shrink-0 select-none text-right text-fg-faint/60">{n}</span>
              <code className="whitespace-pre">
                {toks.map((t, j) => (
                  <span key={j} style={{ color: COL[t.cls] }}>
                    {t.text}
                  </span>
                ))}
              </code>
            </div>
          );
        })}
      </div>
    </div>
  );
}
