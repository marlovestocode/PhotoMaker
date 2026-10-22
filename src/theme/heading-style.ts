import { z } from "zod";
import type { CSSProperties } from "react";
import { colorSchema } from "./design-system";

export const headingStyleSchema = z.object({
    text: z.string().max(100).catch("Untitled Heading"),
    fontSize: z.number().min(12).max(72).catch(24),
    fontWeight: z.enum(["normal", "bold"]).catch("bold"),
    textAlign: z.enum(["left", "center", "right"]).catch("center"),
    color: colorSchema.catch("#292524"),
});

export type HeadingStyle = z.infer<typeof headingStyleSchema>;

export function headingStyleToCss(style: HeadingStyle): CSSProperties {
    return {
        fontSize: `${style.fontSize}px`,
        fontWeight: style.fontWeight,
        textAlign: style.textAlign,
        color: style.color,
    };
}
