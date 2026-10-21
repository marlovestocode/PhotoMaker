import { z } from "zod";
import type { DividerStyle } from "./divider-style";
import type { HeadingStyle } from "./heading-style";

export const presetSchema = z.object({
  name: z.string().max(50).default("Default Preset"),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/), 
  fontFamily: z.enum(["serif", "sans", "display"]),
  borderStyle: z.enum(["sharp", "rounded", "ornate"]), 
})

export type Preset = z.infer<typeof presetSchema>;

export const PRESETS: Record<string, Preset> = {
    victorian: {
        name: "Victorian",
        primaryColor: "#8B4513",
        fontFamily: "serif",
        borderStyle: "ornate"
    },
    medieval: {
        name: "Medieval",
        primaryColor: "#4B0082",
        fontFamily: "serif",
        borderStyle: "sharp"
    },
    draconian: { 
        name: "Draconian",
        primaryColor: "#FF4500",
        fontFamily: "display",
        borderStyle: "sharp"
    }
}


export function presetToDividerStyle(preset: Preset): Partial<DividerStyle> {
    return {
        color: preset.primaryColor,
        ornament: preset.borderStyle === "ornate" ? "fleuron" : "none",
    };
}

export function presetToHeadingStyle(preset: Preset): Partial<HeadingStyle> {
    return {
        color: preset.primaryColor,
        fontWeight: preset.fontFamily === "display" ? "bold" : "normal",
    };
}