import { randomUUID } from "node:crypto";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import sharp from "sharp";
import { z } from "zod";
import { photos } from "@/db/schema";
import { getDb } from "@/server/db";
import { getOwnerAccess } from "@/server/auth/owner";
import { getStorageClient, PHOTO_BUCKET } from "@/server/storage";
import { listOwnerPhotos } from "@/server/photos";

const uploadFieldsSchema = z.object({
    title: z.string().trim().min(1).max(120),
    caption: z.string().trim().max(1000),
    album: z.string().trim().max(80),
});

const MAX_UPLOAD_SIZE = 15 * 1024 * 1024;

export async function GET() {
    const access = await getOwnerAccess();

    if (!access.ok) {
        return Response.json({ error: access.message }, { status: access.status });
    }

    try {
        return Response.json({ photos: await listOwnerPhotos(access.user.id) });
    } catch (error) {
        console.error("Could not load owner photos:", error);
        return Response.json({ error: "Could not load your photos." }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const access = await getOwnerAccess();

    if (!access.ok) {
        return Response.json({ error: access.message }, { status: access.status });
    }

    let formData: FormData;

    try {
        formData = await request.formData();
    } catch (error) {
        console.error("Could not read photo upload form:", error);
        return Response.json({ error: "The upload request could not be read." }, { status: 400 });
    }

    const file = formData.get("file");

    if (!(file instanceof File)) {
        return Response.json({ error: "Choose a photo file to upload." }, { status: 400 });
    }

    if (file.size === 0 || file.size > MAX_UPLOAD_SIZE) {
        return Response.json({ error: "Choose a non-empty photo smaller than 15 MB." }, { status: 413 });
    }

    const fields = uploadFieldsSchema.safeParse({
        title: formData.get("title") || "Untitled photo",
        caption: formData.get("caption") || "",
        album: formData.get("album") || "",
    });

    if (!fields.success) {
        return Response.json({ error: "The title or caption is too long or empty." }, { status: 400 });
    }

    let display: { data: Buffer; info: { width: number; height: number } };
    let thumbnail: Buffer;

    try {
        const source = Buffer.from(await file.arrayBuffer());
        const metadata = await sharp(source, { failOn: "error" }).metadata();

        if (!["jpeg", "png", "webp"].includes(metadata.format ?? "")) {
            return Response.json({ error: "Only JPEG, PNG, and WebP photos are supported." }, { status: 415 });
        }

        display = await sharp(source)
            .rotate()
            .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
            .webp({ quality: 85 })
            .toBuffer({ resolveWithObject: true });

        thumbnail = await sharp(display.data)
            .resize({ width: 480, height: 480, fit: "inside", withoutEnlargement: true })
            .webp({ quality: 75 })
            .toBuffer();
    } catch (error) {
        console.error("Could not process uploaded photo:", error);
        return Response.json({ error: "That file is not a valid supported photo." }, { status: 400 });
    }

    const objectKey = `${access.user.id}/${randomUUID()}.webp`;
    const thumbnailKey = `${access.user.id}/${randomUUID()}-thumb.webp`;
    const storage = getStorageClient();
    const uploadedKeys: string[] = [];

    try {
        await storage.send(
            new PutObjectCommand({
                Bucket: PHOTO_BUCKET,
                Key: objectKey,
                Body: display.data,
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

        const url = await getSignedUrl(
            storage,
            new GetObjectCommand({
                Bucket: PHOTO_BUCKET,
                Key: objectKey,
            }),
            { expiresIn: 3600 },
        );

        const [photo] = await getDb()
            .insert(photos)
            .values({
                ownerId: access.user.id,
                title: fields.data.title,
                caption: fields.data.caption,
                album: fields.data.album,
                objectKey,
                thumbnailKey,
                width: display.info.width,
                height: display.info.height,
            })
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

        if (!photo) {
            throw new Error("The photo insert returned no record.");
        }

        return Response.json({ photo: { ...photo, url } }, { status: 201 });
    } catch (error) {
        if (uploadedKeys.length > 0) {
            try {
                await Promise.all(
                    uploadedKeys.map((key) =>
                        storage.send(new DeleteObjectCommand({ Bucket: PHOTO_BUCKET, Key: key })),
                    ),
                );
            } catch (cleanupError) {
                console.error("Could not clean up uploaded objects after a failed save:", cleanupError);
            }
        }

        console.error("Could not save uploaded photo:", error);
        return Response.json({ error: "The photo could not be saved. Please try again." }, { status: 500 });
    }
}
