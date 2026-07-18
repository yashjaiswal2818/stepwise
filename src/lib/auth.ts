import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import * as schema from "@/db/schema";

/**
 * Better Auth server instance. GitHub is the only provider — the audience is
 * developers, and it's one click for them. Sessions/accounts/users persist to
 * Neon via the Drizzle adapter.
 *
 * `nextCookies()` MUST stay last in `plugins` — it lets sign-in/out set cookies
 * from Server Actions; anything after it silently breaks cookie persistence.
 */
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema, // exports user/session/account/verification (+ the app tables, ignored here)
  }),
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
  },
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
