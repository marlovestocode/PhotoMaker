import { z } from "zod";
import type { CSSProperties } from "react";

export const dividerStyleSchema = z.object({
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#7a5c2e"),
  thickness: z.number().min(1).max(8).default(2),
  opacity: z.number().min(0).max(1).default(1),
  width: z.number().min(20).max(100).default(80), // percent
  spacing: z.number().min(0).max(120).default(40), // px above/below
  ornament: z.enum(["none", "diamond", "dots", "fleuron"]).default("diamond"),
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