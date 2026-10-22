import { z } from "zod";
import type { CSSProperties } from "react";

const placeholderImage = `data:image/svg+xml,${encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400'><rect width='600' height='400' fill='#f1efeb'/><text x='50%' y='50%' font-family='Georgia, serif' font-size='28' fill='#a8a29e' text-anchor='middle' dominant-baseline='middle'>Image</text></svg>",
)}`;

// App photos are served from root-relative routes; external and inline sources stay valid too.
const imageSrcSchema = z
    .string()
    .max(2000)
    .regex(/^(?:https?:\/\/|\/|data:image\/)/i, "Image sources must be URLs, root-relative paths, or data URIs");

export const imageStyleSchema = z.object({
    src: imageSrcSchema.catch(placeholderImage),
    alt: z.string().max(100).catch("Image"),
    caption: z.string().max(200).optional().catch(undefined),
    borderRadius: z.number().min(0).max(40).catch(0),
    maxWidth: z.number().min(50).max(100).catch(100),
});

export type ImageStyle = z.infer<typeof imageStyleSchema>;

export function imageStyleToCssVars(style: ImageStyle): CSSProperties {
    return {
        "--img-border-radius": `${style.borderRadius}px`,
        "--img-max-width": `${style.maxWidth}%`,
    } as CSSProperties;
}
