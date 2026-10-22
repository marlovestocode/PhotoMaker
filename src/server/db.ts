import "server-only";

import { attachDatabasePool } from "@vercel/functions";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/db/schema";
import { getDatabaseConnectionUrl } from "@/db/connection-url";

const globalForDatabase = globalThis as typeof globalThis & {
    photoMakerPool?: Pool;
    photoMakerDatabase?: NodePgDatabase<typeof schema>;
};

export function getDb() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        throw new Error("DATABASE_URL is missing. Run `neon env pull` to restore the Neon connection settings.");
    }

    let pool = globalForDatabase.photoMakerPool;

    if (!pool) {
        pool = new Pool({
            connectionString: getDatabaseConnectionUrl(connectionString),
            max: process.env.NODE_ENV === "production" ? 10 : 1,
        });

        attachDatabasePool(pool);
        globalForDatabase.photoMakerPool = pool;
    }

    return (globalForDatabase.photoMakerDatabase ??= drizzle(pool, { schema }));
}
