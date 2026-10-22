import "server-only";

import { cache } from "react";
import { asc, eq } from "drizzle-orm";
import { presets, sites } from "@/db/schema";
import {
    defaultDesignTokens,
    designTokensSchema,
    pageDesignOverridesSchema,
    siteDesignSchema,
    type SiteDesign,
} from "@/theme/design-system";
import { getDb } from "./db";

/**
 * Recovers every valid piece of a stored theme instead of failing the render.
 * A corrupt theme must never take down the routes that could repair it.
 */
function salvageSiteDesign(theme: unknown): SiteDesign {
    const parsed = siteDesignSchema.safeParse(theme);
    if (parsed.success) {
        return parsed.data;
    }

    console.error("The saved site design does not match the current design schema:", parsed.error);

    const source = (theme ?? {}) as { global?: unknown; pages?: Record<string, unknown> };
    const global = designTokensSchema.safeParse(source.global);
    const pages: SiteDesign["pages"] = {};

    for (const [pageKey, overrides] of Object.entries(source.pages ?? {})) {
        const page = pageDesignOverridesSchema.safeParse(overrides);
        if (page.success) {
            pages[pageKey] = page.data;
        } else {
            console.error(`The saved design overrides for "${pageKey}" were dropped:`, page.error);
        }
    }

    return {
        global: global.success ? global.data : defaultDesignTokens,
        pages,
    };
}

export const getSiteDesign = cache(async (ownerId?: string): Promise<SiteDesign> => {
    const database = getDb();
    const [site] = ownerId
        ? await database
              .select({ theme: sites.theme })
              .from(sites)
              .where(eq(sites.ownerId, ownerId))
              .limit(1)
        : await database.select({ theme: sites.theme }).from(sites).limit(1);

    return salvageSiteDesign(site?.theme);
});

export const getOwnerDesignPresets = cache(async (ownerId: string) => {
    const rows = await getDb()
        .select({ id: presets.id, name: presets.name, tokens: presets.tokens })
        .from(presets)
        .where(eq(presets.ownerId, ownerId))
        .orderBy(asc(presets.name));

    return rows.flatMap((preset) => {
        const parsed = designTokensSchema.safeParse(preset.tokens);

        if (!parsed.success) {
            console.error(`Saved design preset "${preset.name}" was skipped; its tokens are invalid:`, parsed.error);
            return [];
        }

        return [{ id: preset.id, name: preset.name, tokens: parsed.data }];
    });
});
