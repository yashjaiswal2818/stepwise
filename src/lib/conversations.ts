import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { conversation, message } from "@/db/schema";

/** A tool call Ada executed, stored alongside the assistant turn. The UI's human
 *  label ("Jumped to step 7") is derived client-side on reload — it depends on
 *  runtime state — and reloaded actions are displayed, never re-executed. */
export interface StoredAction {
  name: string;
  input: Record<string, unknown>;
}

/** One turn as the chat UI needs it. */
export interface StoredMessage {
  role: "user" | "assistant";
  content: string;
  actions: StoredAction[] | null;
}

/**
 * Find (or create) this user's conversation for a problem — one per
 * (user, problemSlug), so reopening a problem continues where they left off.
 */
export async function ensureConversation(userId: string, problemSlug: string): Promise<string> {
  const existing = await db
    .select({ id: conversation.id })
    .from(conversation)
    .where(and(eq(conversation.userId, userId), eq(conversation.problemSlug, problemSlug)))
    .limit(1);
  if (existing[0]) return existing[0].id;

  const [created] = await db
    .insert(conversation)
    .values({ userId, problemSlug })
    .returning({ id: conversation.id });
  return created.id;
}

/** Append a turn and return the ordinal it was written at. */
export async function appendMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: string,
  actions?: StoredAction[],
): Promise<number> {
  const [last] = await db
    .select({ ordinal: message.ordinal })
    .from(message)
    .where(eq(message.conversationId, conversationId))
    .orderBy(desc(message.ordinal))
    .limit(1);
  const ordinal = (last?.ordinal ?? -1) + 1;

  await db.insert(message).values({
    conversationId,
    ordinal,
    role,
    content,
    actions: actions?.length ? actions : null,
  });
  return ordinal;
}

/**
 * The full transcript for a user + problem, oldest first. Storage keeps every
 * turn; the client's 10-message trim is only a send budget, not a storage limit.
 */
export async function loadHistory(userId: string, problemSlug: string): Promise<StoredMessage[]> {
  const rows = await db
    .select({ role: message.role, content: message.content, actions: message.actions })
    .from(message)
    .innerJoin(conversation, eq(message.conversationId, conversation.id))
    .where(and(eq(conversation.userId, userId), eq(conversation.problemSlug, problemSlug)))
    .orderBy(asc(message.ordinal));

  return rows.map((r) => ({
    role: r.role,
    content: r.content,
    actions: (r.actions as StoredAction[] | null) ?? null,
  }));
}
