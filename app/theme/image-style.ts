import { z } from "zod";
import type { CSSProperties } from "react";

export const imageStyleSchema = z.object({
    src: z.string().url().default("No image URL provided"),
    alt: z.string().max(100).default("Image"),
    caption: z.string().max(200).optional(),
    borderRadius: z.number().min(0).max(40).default(0), // px
    maxWidth: z.number().min(50).max(100).default(100), // percent
});

export type ImageStyle = z.infer<typeof imageStyleSchema>;

export function imageStyleToCssVars(style: ImageStyle): CSSProperties {
    return {
        "--img-border-radius": `${style.borderRadius}px`,
        "--img-max-width": `${style.maxWidth}%`,
    } as CSSProperties;
}