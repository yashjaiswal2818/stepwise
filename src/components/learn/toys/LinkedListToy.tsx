"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Plus } from "lucide-react";
import { DUR, SPRING } from "@/engine/canvas/motion";
import { cn } from "@/lib/utils";
import { ToyButton, ToyFrame } from "./shared";

let lid = 300;
const rand = () => Math.floor(Math.random() * 90) + 10;
const MAX = 5;

/**
 * Touch the list: [append] grows a node at the tail; tapping a node removes it
 * and the chain REWIRES — the previous node's arrow closes onto what the removed
 * node pointed to, and the survivors slide together without ever changing their
 * own memory. The leaving node flashes the mid-move colour so you see the single
 * pointer being re-pointed, which is the whole cost of a delete.
 */
export function LinkedListToy() {
  const [nodes, setNodes] = useState(() => [
    { id: lid++, v: 5 },
    { id: lid++, v: 8 },
    { id: lid++, v: 3 },
  ]);
  const [leaving, setLeaving] = useState<number | null>(null);

  const append = () => {
    if (leaving !== null) return;
    setNodes((n) => (n.length >= MAX ? n : [...n, { id: lid++, v: rand() }]));
  };

  const remove = (id: number) => {
    if (leaving !== null) return;
    setLeaving(id);
    // Let the node wear the mid-move colour for a beat, then rewire past it.
    window.setTimeout(() => {
      setNodes((n) => n.filter((x) => x.id !== id));
      setLeaving(null);
    }, DUR.base * 1000);
  };

  return (
    <ToyFrame label="Linked list — nodes joined by pointers" hint="append · tap to remove">
      <div className="flex flex-col gap-3">
        <div className="flex min-h-[3.25rem] items-center">
          <AnimatePresence initial={false} mode="popLayout">
            {nodes.map((node, i) => {
              const isHead = i === 0;
              const isLeaving = leaving === node.id;
              return (
                <motion.div
                  key={node.id}
                  layout
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={SPRING}
                  className="flex shrink-0 items-center"
                >
                  <div className="relative">
                    {/* The head label is dropped the instant this node stops being first. */}
                    {isHead && (
                      <span className="absolute -top-4 left-0 text-2xs font-medium text-fg-faint">
                        head
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => remove(node.id)}
                      disabled={leaving !== null}
                      aria-label={`Node ${node.v}${isHead ? " (head)" : ""} — tap to remove`}
                      className={cn(
                        "grid size-8 place-items-center rounded-sm border font-mono text-sm transition-colors duration-[var(--duration-fast)] ease-out",
                        isLeaving
                          ? "border-state-swap bg-surface-3 text-fg"
                          : "border-line bg-surface-2 text-fg-muted hover:border-line-strong hover:text-fg",
                      )}
                    >
                      {node.v}
                    </button>
                  </div>
                  <ArrowRight className="mx-1 size-3.5 shrink-0 text-fg-muted" aria-hidden />
                </motion.div>
              );
            })}
          </AnimatePresence>
          {/* The tail always points at nothing — ∅ is the sentinel, not a node. */}
          <motion.span
            layout
            transition={SPRING}
            className="grid size-8 shrink-0 place-items-center rounded-sm border border-dashed border-line font-mono text-sm text-fg-faint"
          >
            ∅
          </motion.span>
        </div>

        <div className="flex items-center gap-2">
          <ToyButton onClick={append} disabled={nodes.length >= MAX} aria-label="Append a node to the tail">
            <Plus className="size-3.5" aria-hidden />
            append
          </ToyButton>
          <p className="text-2xs text-fg-faint">
            Removing a node just rewires one pointer.
          </p>
        </div>
      </div>
    </ToyFrame>
  );
}
