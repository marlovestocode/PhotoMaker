import { randomUUID } from "node:crypto";
import {
    DeleteObjectCommand,
    GetObjectCommand,
    PutObjectCommand,
} from "@aws-sdk/client-s3";
import { and, eq } from "drizzle-orm";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import sharp from "sharp";
import { z } from "zod";
import { photos } from "@/db/schema";
import { getDb } from "@/server/db";
import { getOwnerAccess } from "@/server/auth/owner";
import { getStorageClient, PHOTO_BUCKET } from "@/server/storage";

const photoIdSchema = z.string().uuid();
const updatePhotoSchema = z
    .object({
        title: z.string().trim().min(1).max(120).optional(),
        caption: z.string().trim().max(1000).optional(),
        album: z.string().trim().max(80).optional(),
        isFavorite: z.boolean().optional(),
        visibility: z.enum(["private", "public"]).optional(),
        crop: z.enum(["square", "landscape", "portrait"]).optional(),
        rotation: z.union([z.literal(90), z.literal(180), z.literal(270)]).optional(),
    })
    .refine((value) => Object.keys(value).length > 0);

const cropRatios = {
    square: 1,
    landscape: 4 / 3,
    portrait: 3 / 4,
} as const;

type RouteContext = { params: Promise<{ id: string }> };

async function findOwnedPhoto(photoId: string, ownerId: string) {
    const [photo] = await getDb()
        .select()
        .from(photos)
        .where(and(eq(photos.id, photoId), eq(photos.ownerId, ownerId)))
        .limit(1);

    return photo;
}

async function removeObjects(keys: string[]) {
    const results = await Promise.allSettled(
        keys.map(async (key) =>
            getStorageClient().send(new DeleteObjectCommand({ Bucket: PHOTO_BUCKET, Key: key })),
        ),
    );
    const failedKeys = results.flatMap((result, index) =>
        result.status === "rejected" ? [keys[index]] : [],
    );

    if (failedKeys.length > 0) {
        console.error("Could not remove photo storage objects:", failedKeys);
    }

    return failedKeys.length > 0;
}

export async function PATCH(request: Request, { params }: RouteContext) {
    const access = await getOwnerAccess();

    if (!access.ok) {
        return Response.json({ error: access.message }, { status: access.status });
    }

    const { id } = await params;
    const parsedId = photoIdSchema.safeParse(id);

    if (!parsedId.success) {
        return Response.json({ error: "That photo could not be found." }, { status: 404 });
    }

    let body: unknown;

    try {
        body = await request.json();
    } catch (error) {
        console.error("Could not read photo update request:", error);
        return Response.json({ error: "The photo update request could not be read." }, { status: 400 });
    }

    const parsedUpdate = updatePhotoSchema.safeParse(body);

    if (!parsedUpdate.success) {
        return Response.json({ error: "Check the photo details and try again." }, { status: 400 });
    }

    let photo;

    try {
        photo = await findOwnedPhoto(parsedId.data, access.user.id);
    } catch (error) {
        console.error("Could not find photo to update:", error);
        return Response.json({ error: "The photo could not be updated." }, { status: 500 });
    }

    if (!photo) {
        return Response.json({ error: "That photo could not be found." }, { status: 404 });
    }

    const { title, caption, album, isFavorite, visibility, crop, rotation } = parsedUpdate.data;
    const changesPixels = crop !== undefined || rotation !== undefined;
    let storage;

    try {
        storage = getStorageClient();
    } catch (error) {
        console.error("Could not configure photo storage:", error);
        return Response.json({ error: "Photo storage is unavailable. Please try again." }, { status: 500 });
    }

    const uploadedKeys: string[] = [];
    let replacement:
        | { objectKey: string; thumbnailKey: string; width: number; height: number }
        | undefined;

    if (changesPixels) {
        let source: Buffer;

        try {
            const stored = await storage.send(
                new GetObjectCommand({ Bucket: PHOTO_BUCKET, Key: photo.objectKey }),
            );

            if (!stored.Body) {
                throw new Error("The stored photo had no image data.");
            }

            source = Buffer.from(await stored.Body.transformToByteArray());
        } catch (error) {
            console.error("Could not load photo for editing:", error);
            return Response.json({ error: "The photo could not be loaded for editing." }, { status: 500 });
        }

        let displayData: Buffer;
        let displayWidth: number;
        let displayHeight: number;
        let thumbnail: Buffer;

        try {
            const metadata = await sharp(source, { failOn: "error" }).metadata();

            if (!metadata.width || !metadata.height) {
                throw new Error("The stored photo has invalid dimensions.");
            }

            const isQuarterTurn = rotation === 90 || rotation === 270;
            const width = isQuarterTurn ? metadata.height : metadata.width;
            const height = isQuarterTurn ? metadata.width : metadata.height;
            let pipeline = sharp(source);

            if (rotation !== undefined) {
                pipeline = pipeline.rotate(rotation);
            }

            if (crop) {
                const ratio = cropRatios[crop];
                const cropWidth = width / height > ratio ? Math.floor(height * ratio) : width;
                const cropHeight = width / height > ratio ? height : Math.floor(width / ratio);
                pipeline = pipeline.extract({
                    left: Math.floor((width - cropWidth) / 2),
                    top: Math.floor((height - cropHeight) / 2),
                    width: cropWidth,
                    height: cropHeight,
                });
            }

            const display = await pipeline
                .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
                .webp({ quality: 85 })
                .toBuffer({ resolveWithObject: true });
            thumbnail = await sharp(display.data)
                .resize({ width: 480, height: 480, fit: "inside", withoutEnlargement: true })
                .webp({ quality: 75 })
                .toBuffer();
            displayData = display.data;
            displayWidth = display.info.width;
            displayHeight = display.info.height;
        } catch (error) {
            console.error("Could not crop or rotate photo:", error);
            return Response.json({ error: "The photo could not be edited. Please try again." }, { status: 400 });
        }

        const objectKey = `${access.user.id}/${randomUUID()}.webp`;
        const thumbnailKey = `${access.user.id}/${randomUUID()}-thumb.webp`;

        try {
            await storage.send(
                new PutObjectCommand({
                    Bucket: PHOTO_BUCKET,
                    Key: objectKey,
                    Body: displayData,
                    ContentType: "image/webp",
                }),
            );
            uploadedKeys.push(objectKey);
            await storage.send(
                new PutObjectCommand({
                    Bucket: PHOTO_BUCKET,
                    Key: thumbnailKey,
                    Body: thumbnail,
                    ContentType: "image/webp",
                }),
            );
            uploadedKeys.push(thumbnailKey);
        } catch (error) {
            if (uploadedKeys.length > 0) {
                await removeObjects(uploadedKeys);
            }

            console.error("Could not save edited photo to storage:", error);
            return Response.json({ error: "The edited photo could not be saved. Please try again." }, { status: 500 });
        }

        replacement = {
            objectKey,
            thumbnailKey,
            width: displayWidth,
            height: displayHeight,
        };
    }

    try {
        const url = await getSignedUrl(
            storage,
            new GetObjectCommand({ Bucket: PHOTO_BUCKET, Key: replacement?.objectKey ?? photo.objectKey }),
            { expiresIn: 3600 },
        );
        const updates = {
            ...(title !== undefined ? { title } : {}),
            ...(caption !== undefined ? { caption } : {}),
            ...(album !== undefined ? { album } : {}),
            ...(isFavorite !== undefined ? { isFavorite } : {}),
            ...(visibility !== undefined ? { visibility } : {}),
            ...(replacement ?? {}),
        };
        const [updated] = await getDb()
            .update(photos)
            .set(updates)
            .where(and(eq(photos.id, photo.id), eq(photos.ownerId, access.user.id)))
            .returning({
                id: photos.id,
                title: photos.title,
                caption: photos.caption,
                album: photos.album,
                isFavorite: photos.isFavorite,
                width: photos.width,
                height: photos.height,
                visibility: photos.visibility,
            });

        if (!updated) {
            if (uploadedKeys.length > 0) {
                await removeObjects(uploadedKeys);
            }
            return Response.json({ error: "That photo could not be found." }, { status: 404 });
        }

        const cleanupPending = replacement
            ? await removeObjects([photo.objectKey, photo.thumbnailKey])
            : false;

        return Response.json({ photo: { ...updated, url }, cleanupPending });
    } catch (error) {
        if (uploadedKeys.length > 0) {
            await removeObjects(uploadedKeys);
        }

        console.error("Could not save photo updates:", error);
        return Response.json({ error: "The photo could not be updated. Please try again." }, { status: 500 });
    }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
    const access = await getOwnerAccess();

    if (!access.ok) {
        return Response.json({ error: access.message }, { status: access.status });
    }

    const { id } = await params;
    const parsedId = photoIdSchema.safeParse(id);

    if (!parsedId.success) {
        return Response.json({ error: "That photo could not be found." }, { status: 404 });
    }

    try {
        const photo = await findOwnedPhoto(parsedId.data, access.user.id);

        if (!photo) {
            return Response.json({ error: "That photo could not be found." }, { status: 404 });
        }

        const [deleted] = await getDb()
            .delete(photos)
            .where(and(eq(photos.id, photo.id), eq(photos.ownerId, access.user.id)))
            .returning({ id: photos.id });

        if (!deleted) {
            return Response.json({ error: "That photo could not be found." }, { status: 404 });
        }

        const cleanupPending = await removeObjects([photo.objectKey, photo.thumbnailKey]);
        return Response.json({ deleted: true, cleanupPending });
    } catch (error) {
        console.error("Could not delete photo:", error);
        return Response.json({ error: "The photo could not be deleted. Please try again." }, { status: 500 });
    }
}
