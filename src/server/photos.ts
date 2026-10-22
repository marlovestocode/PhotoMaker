import "server-only";

import { desc, eq } from "drizzle-orm";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { photos } from "@/db/schema";
import type { PhotoCard, PublicPhotoCard } from "@/features/photos/contracts";
import { getDb } from "@/server/db";
import { getStorageClient, PHOTO_BUCKET } from "@/server/storage";

export async function listOwnerPhotos(ownerId: string): Promise<PhotoCard[]> {
    const records = await getDb()
        .select({
            id: photos.id,
            title: photos.title,
            caption: photos.caption,
            album: photos.album,
            isFavorite: photos.isFavorite,
            width: photos.width,
            height: photos.height,
            objectKey: photos.objectKey,
            visibility: photos.visibility,
        })
        .from(photos)
        .where(eq(photos.ownerId, ownerId))
        .orderBy(desc(photos.createdAt));

    return Promise.all(
        records.map(async (photo) => ({
            id: photo.id,
            title: photo.title,
            caption: photo.caption,
            album: photo.album,
            isFavorite: photo.isFavorite,
            width: photo.width,
            height: photo.height,
            visibility: photo.visibility === "public" ? "public" : "private",
            url: await getSignedUrl(
                getStorageClient(),
                new GetObjectCommand({ Bucket: PHOTO_BUCKET, Key: photo.objectKey }),
                { expiresIn: 3600 },
            ),
        })),
    );
}

export async function listPublicPhotos(): Promise<PublicPhotoCard[]> {
    const records = await getDb()
        .select({
            id: photos.id,
            title: photos.title,
            caption: photos.caption,
            album: photos.album,
            isFavorite: photos.isFavorite,
            width: photos.width,
            height: photos.height,
        })
        .from(photos)
        .where(eq(photos.visibility, "public"))
        .orderBy(desc(photos.createdAt));

    return records.map((photo) => ({
        id: photo.id,
        title: photo.title,
        caption: photo.caption,
        album: photo.album,
        isFavorite: photo.isFavorite,
        width: photo.width,
        height: photo.height,
        thumbnailUrl: `/api/gallery/${photo.id}/image`,
        imageUrl: `/api/gallery/${photo.id}/image?size=full`,
    }));
}
