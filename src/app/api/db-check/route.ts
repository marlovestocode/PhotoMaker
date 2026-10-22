import { sql } from "drizzle-orm";
import { connection } from "next/server";
import { photos } from "@/db/schema";
import { getDb } from "@/server/db";

export async function GET() {
    await connection();

    try {
        await getDb().execute(sql`SELECT 1`);
        await getDb().select({ id: photos.id }).from(photos).limit(1);
        return Response.json({ connected: true, schema: "ready" });
    } catch (error) {
        console.error("Neon database connection check failed:", error);
        return Response.json(
            { connected: false, error: "Could not connect to the database or find the app schema." },
            { status: 500 },
        );
    }
}
