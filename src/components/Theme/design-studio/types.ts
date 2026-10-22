import type { DesignTokens } from "@/theme/design-system";

export type SavedPreset = {
    id: string;
    name: string;
    tokens: DesignTokens;
};

export type PendingAction = "design" | "preset" | "delete-preset" | null;

export type NoticeTone = "success" | "error" | "info";

export type StudioNotice = {
    id: number;
    tone: NoticeTone;
    message: string;
};

export type StudioSectionId =
    | "colors"
    | "typography"
    | "layout"
    | "gallery"
    | "upload"
    | "presets"
    | "routes"
    | "tools";

export type ElementBreakpoint = "desktop" | "tablet" | "mobile";
