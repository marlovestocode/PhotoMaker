import { z } from "zod";

export const photoCardSchema = z.object({
    id: z.string().uuid(),
    title: z.string(),
    caption: z.string(),
    album: z.string(),
    isFavorite: z.boolean(),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    url: z.url(),
    visibility: z.enum(["private", "public"]),
});

export const uploadResponseSchema = z.object({
    photo: photoCardSchema,
});

export const updatePhotoResponseSchema = z.object({
    photo: photoCardSchema,
    cleanupPending: z.boolean().optional(),
});

export type PhotoCard = z.infer<typeof photoCardSchema>;
export type PublicPhotoCard = Omit<PhotoCard, "url" | "visibility"> & {
    thumbnailUrl: string;
    imageUrl: string;
};
