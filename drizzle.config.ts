import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";
import { getDatabaseConnectionUrl } from "./src/db/connection-url";

config({ path: ".env.local" });

const migrationDatabaseUrl = process.env.DATABASE_URL_UNPOOLED;

if (!migrationDatabaseUrl) {
    throw new Error("DATABASE_URL_UNPOOLED is missing. Run `neon env pull` before managing migrations.");
}

export default defineConfig({
    schema: "./src/db/schema.ts",
    out: "./drizzle",
    dialect: "postgresql",
    dbCredentials: {
        url: getDatabaseConnectionUrl(migrationDatabaseUrl),
    },
});
