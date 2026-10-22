import { eq } from "drizzle-orm";
import { getOwnerAccess } from "@/server/auth/owner";
import { getDb } from "@/server/db";
import { sites } from "@/db/schema";
import { siteDesignSchema } from "@/theme/design-system";

export async function PUT(request: Request) {
    const access = await getOwnerAccess();

    if (!access.ok) {
        return Response.json({ error: access.message }, { status: access.status });
    }

    let body: unknown;

    try {
        body = await request.json();
    } catch (error) {
        console.error("Could not parse the site design request:", error);
        return Response.json({ error: "The design settings request is not valid JSON." }, { status: 400 });
    }

    const parsed = siteDesignSchema.safeParse(body);

    if (!parsed.success) {
        return Response.json(
            { error: "The design settings contain invalid values.", issues: parsed.error.issues },
            { status: 400 },
        );
    }

    try {
        await getDb()
            .insert(sites)
            .values({ ownerId: access.user.id, theme: parsed.data })
            .onConflictDoUpdate({
                target: sites.ownerId,
                set: { theme: parsed.data, updatedAt: new Date() },
            });

        return Response.json({ saved: true });
    } catch (error) {
        console.error("Could not save the site design:", error);
        return Response.json({ error: "The design settings could not be saved." }, { status: 500 });
    }
}

export async function GET() {
    const access = await getOwnerAccess();

    if (!access.ok) {
        return Response.json({ error: access.message }, { status: access.status });
    }

    try {
        const [site] = await getDb()
            .select({ theme: sites.theme })
            .from(sites)
            .where(eq(sites.ownerId, access.user.id))
            .limit(1);

        const parsed = siteDesignSchema.safeParse(site?.theme ?? {});

        if (!parsed.success) {
            console.error("The saved site design could not be validated:", parsed.error);
            return Response.json({ error: "The saved design settings are invalid." }, { status: 500 });
        }

        return Response.json({ design: parsed.data });
    } catch (error) {
        console.error("Could not load the saved site design:", error);
        return Response.json({ error: "The design settings could not be loaded." }, { status: 500 });
    }
}
