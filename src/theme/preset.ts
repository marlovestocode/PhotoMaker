import { z } from "zod";
import { builtInLayoutPresets, type DesignTokens } from "./design-system";
import type { DividerStyle } from "./divider-style";
import type { HeadingStyle } from "./heading-style";

export const presetSchema = z.object({
    name: z.string().max(50),
    primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    fontFamily: z.enum(["serif", "sans", "display"]),
    borderStyle: z.enum(["sharp", "rounded", "ornate"]),
});

export type Preset = z.infer<typeof presetSchema>;

// Single source of truth: the section presets are derived from the layout
// presets so the same named theme always shows the same colors and fonts.
function sectionPreset({ name, tokens }: { name: string; tokens: DesignTokens }): Preset {
    const fontFamily: Preset["fontFamily"] =
        tokens.headingFont === "monospace" ? "sans" : tokens.headingFont;

    return presetSchema.parse({
        name,
        primaryColor: tokens.accent,
        fontFamily,
        borderStyle: tokens.borderStyle === "double" ? "ornate" : "sharp",
    });
}

export const PRESETS: Record<string, Preset> = Object.fromEntries(
    builtInLayoutPresets.map((preset) => [preset.id, sectionPreset(preset)]),
);

export function presetToDividerStyle(preset: Preset): Partial<DividerStyle> {
    return {
        color: preset.primaryColor,
        ornament: preset.borderStyle === "ornate" ? "fleuron" : preset.borderStyle === "sharp" ? "diamond" : "none",
        thickness: preset.borderStyle === "ornate" ? 3 : 2,
        width: preset.borderStyle === "ornate" ? 60 : 80,
        spacing: preset.borderStyle === "ornate" ? 60 : 40,
    };
}

export function presetToHeadingStyle(preset: Preset): Partial<HeadingStyle> {
    return {
        color: preset.primaryColor,
        fontSize: preset.fontFamily === "display" ? 36 : 24,
        textAlign: "center",
        fontWeight: preset.fontFamily === "display" ? "bold" : "normal",
    };
}
