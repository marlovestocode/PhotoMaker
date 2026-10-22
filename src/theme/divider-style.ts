import { z } from "zod";
import type { CSSProperties } from "react";
import { colorSchema } from "./design-system";

export const dividerStyleSchema = z.object({
    color: colorSchema.catch("#7a5c2e"),
    thickness: z.number().min(1).max(8).catch(2),
    opacity: z.number().min(0).max(1).catch(1),
    width: z.number().min(20).max(100).catch(80),
    spacing: z.number().min(0).max(120).catch(40),
    ornament: z.enum(["none", "diamond", "dots", "fleuron"]).catch("diamond"),
});

export type DividerStyle = z.infer<typeof dividerStyleSchema>;

export function styleToCssVars(style: DividerStyle): CSSProperties {
    return {
        "--d-color": style.color,
        "--d-thickness": `${style.thickness}px`,
        "--d-width": `${style.width}%`,
        "--d-spacing": `${style.spacing}px`,
        "--d-opacity": String(style.opacity),
    } as CSSProperties;
}
