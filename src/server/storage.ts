import "server-only";

import { S3Client } from "@aws-sdk/client-s3";

export const PHOTO_BUCKET = "images";

let storage: S3Client | undefined;

function requiredStorageVariable(name: string) {
    const value = process.env[name];

    if (!value) {
        throw new Error(`${name} is missing. Run \`neon env pull\` to restore the Object Storage credentials.`);
    }

    return value;
}

export function getStorageClient() {
    storage ??= new S3Client({
        endpoint: requiredStorageVariable("AWS_ENDPOINT_URL_S3"),
        region: requiredStorageVariable("AWS_REGION"),
        credentials: {
            accessKeyId: requiredStorageVariable("AWS_ACCESS_KEY_ID"),
            secretAccessKey: requiredStorageVariable("AWS_SECRET_ACCESS_KEY"),
        },
        forcePathStyle: true,
    });

    return storage;
}
