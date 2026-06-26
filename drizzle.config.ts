import type { Config } from "drizzle-kit";
import "dotenv/config";

export default {
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.POSTGRES_URL_NON_POOLING ?? process.env.POSTGRES_URL ?? "",
  },
  strict: true,
  verbose: true,
} satisfies Config;
