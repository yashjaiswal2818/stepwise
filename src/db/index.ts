import "server-only";
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as schema from "./schema";

/**
 * Neon's serverless driver over WebSockets. Chosen over the simpler neon-http
 * driver because Better Auth's Drizzle adapter calls `db.transaction()` on some
 * write paths, which neon-http can't do; the WebSocket Pool supports it and is
 * still serverless-safe (Neon's proxy pools connections, so Vercel's ephemeral
 * functions don't exhaust Postgres).
 *
 * Node < 22 has no global WebSocket, so the driver needs one supplied. Node 22+
 * (and browsers) have it globally, so the polyfill is only wired in when absent.
 */
if (!globalThis.WebSocket) {
  neonConfig.webSocketConstructor = ws;
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });
