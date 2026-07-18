import { pgTable, text, integer, timestamp, uuid, jsonb, unique } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

// Re-export the Better Auth tables so `import * as schema from "@/db/schema"`
// gives the drizzle client + adapter the whole schema in one object.
export * from "./auth-schema";

/**
 * Problems are referenced by SLUG, not a foreign key — there is no problems
 * table and there shouldn't be. All problem metadata lives in
 * src/curriculum/catalog.ts, keyed by slug, and traces are generated functions
 * (src/algorithms/*), so nothing about a problem is persisted here beyond its
 * slug. See PRD-V2 Phase 4.
 */

/**
 * A learner's completion of a problem — the server-side home for
 * useProgress.solved[] (currently localStorage-only). A problem is "solved" by
 * reaching the last visualization step. Unique(userId, problemSlug) makes the
 * server-side markSolved idempotent, mirroring the client's dedup-on-append.
 */
export const solvedProblem = pgTable(
  "solved_problem",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    problemSlug: text("problem_slug").notNull(),
    solvedAt: timestamp("solved_at").notNull().defaultNow(),
  },
  (t) => [unique().on(t.userId, t.problemSlug)],
);

/**
 * Per-user scalar profile: the non-list fields of useProgress (streak, daily
 * activity, mode). One row per user. `lastActiveDay` is a YYYY-MM-DD string to
 * match the client's dayKey exactly.
 */
export const userProfile = pgTable("user_profile", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  streak: integer("streak").notNull().default(0),
  lastActiveDay: text("last_active_day"),
  mode: text("mode").$type<"beginner" | "interview">().notNull().default("beginner"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * One tutor conversation, scoped to a user + problem. Named "conversation"
 * rather than "session" to avoid colliding with Better Auth's auth `session`
 * table.
 */
export const conversation = pgTable("conversation", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  problemSlug: text("problem_slug").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * One message in a conversation. `ordinal` preserves render order (the UI trims
 * by recency but storage keeps the full transcript). `actions` captures the
 * assistant's tool_use events (name + input) — which the inbound wire history
 * drops, so the DB holds richer context than the client sends back. The UI's
 * human label is derived client-side on reload (it depends on runtime state),
 * and reloaded actions are shown, never re-executed against the visualization.
 */
export const message = pgTable("message", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => conversation.id, { onDelete: "cascade" }),
  ordinal: integer("ordinal").notNull(),
  role: text("role").$type<"user" | "assistant">().notNull(),
  content: text("content").notNull(),
  kind: text("kind").$type<"normal" | "error">().notNull().default("normal"),
  actions: jsonb("actions").$type<{ name: string; input: Record<string, unknown> }[]>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
