ALTER TABLE "photos" ADD COLUMN "album" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "photos" ADD COLUMN "is_favorite" boolean DEFAULT false NOT NULL;