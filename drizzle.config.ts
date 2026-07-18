import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Load .env.local (the file Next uses) so the online commands (migrate/push/pull)
// see DATABASE_URL. `drizzle-kit generate` ignores dbCredentials entirely — it
// only reads schema + dialect — so migrations can be generated before Neon exists.
config({ path: ".env.local" });

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
});
