import { getOwnerAccess } from "@/server/auth/owner";
import { getDb } from "@/server/db";
import { presets } from "@/db/schema";
import { designTokensSchema } from "@/theme/design-system";
import { z } from "zod";

const savePresetSchema = z.object({
    name: z.string().trim().min(1).max(50),
    tokens: designTokensSchema,
});

export async function POST(request: Request) {
    const access = await getOwnerAccess();

    if (!access.ok) {
        return Response.json({ error: access.message }, { status: access.status });
    }

    let body: unknown;

    try {
        body = await request.json();
    } catch (error) {
        console.error("Could not parse the design preset request:", error);
        return Response.json({ error: "The preset request is not valid JSON." }, { status: 400 });
    }

    const parsed = savePresetSchema.safeParse(body);

    if (!parsed.success) {
        return Response.json(
            { error: "Enter a preset name and provide valid design settings.", issues: parsed.error.issues },
            { status: 400 },
        );
    }

    try {
        const [preset] = await getDb()
            .insert(presets)
            .values({
                ownerId: access.user.id,
                name: parsed.data.name,
                tokens: parsed.data.tokens,
                isSystem: false,
            })
            .returning({ id: presets.id, name: presets.name, tokens: presets.tokens });

        if (!preset) {
            throw new Error("The preset insert returned no row.");
        }

        return Response.json({ preset }, { status: 201 });
    } catch (error) {
        console.error("Could not save the design preset:", error);
        return Response.json({ error: "The design preset could not be saved." }, { status: 500 });
    }
}
