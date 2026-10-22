import {
    DeleteObjectCommand,
    GetObjectCommand,
    PutObjectCommand,
} from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";
import { config } from "dotenv";
import { sql } from "drizzle-orm";
import { photos } from "@/db/schema";
import { getDb } from "@/server/db";
import { getStorageClient, PHOTO_BUCKET } from "@/server/storage";

config({ path: ".env.local" });

async function verifyNeonServices() {
    const database = getDb();
    await database.execute(sql`SELECT 1`);
    await database.select({ id: photos.id }).from(photos).limit(1);
    console.log("Postgres: connected; application photo schema is available.");

    const key = `_health-check/${randomUUID()}.txt`;
    const content = "Photo Maker Neon storage check";
    const storage = getStorageClient();
    let uploaded = false;

    try {
        await storage.send(
            new PutObjectCommand({
                Bucket: PHOTO_BUCKET,
                Key: key,
                Body: content,
                ContentType: "text/plain",
            }),
        );
        uploaded = true;

        const object = await storage.send(new GetObjectCommand({ Bucket: PHOTO_BUCKET, Key: key }));
        const downloaded = await object.Body?.transformToString();

        if (downloaded !== content) {
            throw new Error("The uploaded storage object did not match the downloaded object.");
        }

        console.log("Object Storage: uploaded and downloaded a private test object.");
    } finally {
        if (uploaded) {
            await storage.send(new DeleteObjectCommand({ Bucket: PHOTO_BUCKET, Key: key }));
        }
    }
}

verifyNeonServices().catch((error: unknown) => {
    console.error("Neon service verification failed:", error);
    process.exitCode = 1;
});
