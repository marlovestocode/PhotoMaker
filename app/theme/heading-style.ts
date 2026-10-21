import { z } from "zod";
import type { CSSProperties } from "react";


export const headingStyleSchema = z.object({
    text: z.string().max(100).default("Untitled Heading"),
    fontSize: z.number().min(12).max(72).default(24),
    fontWeight: z.enum(["normal", "bold"]).default("bold"),
    textAlign: z.enum(["left", "center", "right"]).default("center"),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#000000"),
});

export type HeadingStyle = z.infer<typeof headingStyleSchema>;

export function headingStyleToCssVars(style: HeadingStyle): CSSProperties {
    return {
        "--h-font-size": `${style.fontSize}px`,
        "--h-font-weight": style.fontWeight,
        "--h-text-align": style.textAlign,
        "--h-color": style.color,
    } as CSSProperties;
}