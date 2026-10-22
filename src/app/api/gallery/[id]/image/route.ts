import { createHash } from "node:crypto";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { photos } from "@/db/schema";
import { getDb } from "@/server/db";
import { getStorageClient, PHOTO_BUCKET } from "@/server/storage";

const photoIdSchema = z.string().uuid();

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    if (!photoIdSchema.safeParse(id).success) {
        return new Response("Photo not found.", { status: 404 });
    }

    const size = new URL(request.url).searchParams.get("size") ?? "thumbnail";

    if (size !== "thumbnail" && size !== "full") {
        return new Response("Invalid image size.", { status: 400 });
    }

    try {
        const [photo] = await getDb()
            .select({
                objectKey: photos.objectKey,
                thumbnailKey: photos.thumbnailKey,
            })
            .from(photos)
            .where(and(eq(photos.id, id), eq(photos.visibility, "public")))
            .limit(1);

        if (!photo) {
            return new Response("Photo not found.", { status: 404 });
        }

        const objectKey = size === "full" ? photo.objectKey : photo.thumbnailKey;
        const etag = `"${createHash("sha256").update(objectKey).digest("hex")}"`;
        const cacheHeaders = {
            "Cache-Control": "private, no-cache",
            ETag: etag,
        };
        const ifNoneMatch = request.headers.get("if-none-match");

        if (ifNoneMatch?.split(",").some((tag) => tag.trim() === etag || tag.trim() === "*")) {
            return new Response(null, { status: 304, headers: cacheHeaders });
        }

        const image = await getStorageClient().send(
            new GetObjectCommand({
                Bucket: PHOTO_BUCKET,
                Key: objectKey,
            }),
        );

        if (!image.Body) {
            throw new Error("The stored photo had no image data.");
        }

        return new Response(image.Body.transformToWebStream(), {
            headers: {
                ...cacheHeaders,
                "Content-Disposition": "inline",
                "Content-Type": "image/webp",
                "X-Content-Type-Options": "nosniff",
            },
        });
    } catch (error) {
        console.error("Could not load public gallery photo:", error);
        return new Response("The photo could not be loaded.", { status: 500 });
    }
}
