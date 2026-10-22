import {
    boolean,
    index,
    integer,
    jsonb,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
    uuid,
} from "drizzle-orm/pg-core";

export const sites = pgTable(
    "sites",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        ownerId: text("owner_id").notNull(),
        title: text("title").notNull().default("Our Family"),
        theme: jsonb("theme").$type<Record<string, unknown>>().notNull().default({}),
        createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [uniqueIndex("sites_owner_id_idx").on(table.ownerId)],
);

export const sections = pgTable(
    "sections",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        siteId: uuid("site_id")
            .notNull()
            .references(() => sites.id, { onDelete: "cascade" }),
        type: text("type").notNull(),
        position: integer("position").notNull().default(0),
        title: text("title"),
        content: jsonb("content").$type<Record<string, unknown>>().notNull().default({}),
        style: jsonb("style").$type<Record<string, unknown>>().notNull().default({}),
        visible: boolean("visible").notNull().default(true),
        createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [index("sections_site_position_idx").on(table.siteId, table.position)],
);

export const photos = pgTable(
    "photos",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        ownerId: text("owner_id").notNull(),
        title: text("title").notNull().default("Untitled photo"),
        caption: text("caption").notNull().default(""),
        album: text("album").notNull().default(""),
        isFavorite: boolean("is_favorite").notNull().default(false),
        objectKey: text("object_key").notNull().unique(),
        thumbnailKey: text("thumbnail_key").notNull().unique(),
        width: integer("width").notNull(),
        height: integer("height").notNull(),
        position: integer("position").notNull().default(0),
        visibility: text("visibility").notNull().default("private"),
        shareToken: text("share_token").unique(),
        commentsEnabled: boolean("comments_enabled").notNull().default(true),
        themeMode: text("theme_mode").notNull().default("inherit"),
        theme: jsonb("theme").$type<Record<string, unknown>>().notNull().default({}),
        createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [index("photos_owner_created_idx").on(table.ownerId, table.createdAt)],
);

export const presets = pgTable("presets", {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: text("owner_id"),
    name: text("name").notNull(),
    tokens: jsonb("tokens").$type<Record<string, unknown>>().notNull().default({}),
    ornamentSet: text("ornament_set"),
    isSystem: boolean("is_system").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
