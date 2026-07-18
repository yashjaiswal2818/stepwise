import { getCurrentUser } from "@/lib/dal";
import { loadHistory } from "@/lib/conversations";

export const runtime = "nodejs";

/**
 * Prior transcript for the signed-in user on one problem. Anonymous users get an
 * empty list — the tutor still works for them, it just doesn't remember.
 */
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ messages: [] });

  const slug = new URL(req.url).searchParams.get("slug");
  if (!slug) return Response.json({ messages: [] });

  try {
    return Response.json({ messages: await loadHistory(user.id, slug) });
  } catch {
    // History is a nice-to-have; never let a DB hiccup break opening the panel.
    return Response.json({ messages: [] });
  }
}
