import { and, eq } from "drizzle-orm";
import { getOwnerAccess } from "@/server/auth/owner";
import { getDb } from "@/server/db";
import { presets } from "@/db/schema";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    const access = await getOwnerAccess();

    if (!access.ok) {
        return Response.json({ error: access.message }, { status: access.status });
    }

    const { id } = await params;

    try {
        const [deleted] = await getDb()
            .delete(presets)
            .where(and(eq(presets.id, id), eq(presets.ownerId, access.user.id), eq(presets.isSystem, false)))
            .returning({ id: presets.id });

        if (!deleted) {
            return Response.json({ error: "That custom preset was not found." }, { status: 404 });
        }

        return Response.json({ deleted: true });
    } catch (error) {
        console.error("Could not delete the design preset:", error);
        return Response.json({ error: "The design preset could not be deleted." }, { status: 500 });
    }
}
