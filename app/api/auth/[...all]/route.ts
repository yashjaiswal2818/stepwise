import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

// Mounts every Better Auth endpoint (sign-in, GitHub OAuth callback, session,
// sign-out) under /api/auth. The path must stay exactly /api/auth/[...all] —
// the GitHub callback URL and the client both assume it. Node runtime (default).
export const { GET, POST } = toNextJsHandler(auth);
