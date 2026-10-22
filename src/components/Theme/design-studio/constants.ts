import type { DesignTokens } from "@/theme/design-system";
import type { StudioIconName } from "./icons";
import type { StudioSectionId } from "./types";

export const PAGE_CHOICES = [
    { path: "/gallery", label: "Public gallery" },
    { path: "/", label: "Home (redirects to photo studio)" },
    { path: "/upload", label: "Photo studio" },
    { path: "/auth/sign-in", label: "Sign-in page" },
    { path: "/dev/divider", label: "Divider demo" },
    { path: "/dev/heading", label: "Heading demo" },
    { path: "/dev/image", label: "Image demo" },
    { path: "/dev/theme", label: "Theme demo" },
] as const;

export const VIEWPORT_OPTIONS: Array<{
    value: number;
    label: string;
    shortLabel: string;
    icon: StudioIconName;
}> = [
    { value: 1280, label: "Desktop preview", shortLabel: "Desktop", icon: "monitor" },
    { value: 768, label: "Tablet preview", shortLabel: "Tablet", icon: "tablet" },
    { value: 390, label: "Mobile preview", shortLabel: "Mobile", icon: "smartphone" },
];

export const FONT_OPTIONS: Array<{ value: DesignTokens["headingFont"]; label: string }> = [
    { value: "serif", label: "Classic serif" },
    { value: "sans", label: "Clean sans serif" },
    { value: "display", label: "Decorative display" },
    { value: "monospace", label: "Monospace" },
];

export const HISTORY_COALESCE_MS = 600;

// This route renders the studio workspace itself, so it cannot be scoped or previewed here.
export const STUDIO_ROUTE = "/settings/design";

export const PREVIEW_HEIGHT = 900;

export type StudioSectionDefinition = {
    id: StudioSectionId;
    label: string;
    description: string;
    group: "Foundation" | "Page" | "System";
    icon: StudioIconName;
    keywords: string;
};

export const STUDIO_SECTIONS: StudioSectionDefinition[] = [
    {
        id: "colors",
        label: "Colors",
        description: "Palette, surfaces, and interactive states.",
        group: "Foundation",
        icon: "palette",
        keywords:
            "colors colour palette background surface text muted accent border button hover focus contrast swatch hex",
    },
    {
        id: "typography",
        label: "Typography",
        description: "Fonts, sizes, weight, and reading rhythm.",
        group: "Foundation",
        icon: "type",
        keywords:
            "typography font fonts heading body size weight line height alignment serif sans display monospace letter",
    },
    {
        id: "layout",
        label: "Layout & shape",
        description: "Page frame, spacing, borders, and depth.",
        group: "Foundation",
        icon: "layout",
        keywords:
            "layout spacing content width padding page frame section spacing corner radius roundness border style shadow depth",
    },
    {
        id: "gallery",
        label: "Gallery content",
        description: "Copy, metadata, sections, and gallery composition.",
        group: "Page",
        icon: "image",
        keywords:
            "gallery exhibition collection album photo cards hero collage featured visit footer masthead navigation copy metadata title description status heading eyebrow byline link empty section columns masonry layout image count scale side",
    },
    {
        id: "upload",
        label: "Photo studio",
        description: "Upload workspace width and composition.",
        group: "Page",
        icon: "upload",
        keywords:
            "upload photo studio workspace fluid contained content width forms panels library page side padding",
    },
    {
        id: "presets",
        label: "Presets",
        description: "Apply a starting point or save your own look.",
        group: "System",
        icon: "layers",
        keywords: "presets preset starting points saved look theme built-in victorian medieval draconian editorial minimal",
    },
    {
        id: "routes",
        label: "Route profiles",
        description: "Scopes, inheritance, and new page profiles.",
        group: "System",
        icon: "route",
        keywords:
            "routes page routes profiles scope scopes inherit inheritance add page profile path dynamic segments site defaults override",
    },
    {
        id: "tools",
        label: "Tools & history",
        description: "Clipboard, resets, shortcuts, and removed elements.",
        group: "System",
        icon: "sliders",
        keywords:
            "tools history clipboard copy paste reset reset scope defaults revert removed elements restore shortcuts keyboard undo redo",
    },
];

export function pageLabel(path: string): string {
    return PAGE_CHOICES.find((page) => page.path === path)?.label ?? path;
}

export function isSectionAvailable(
    section: StudioSectionId,
    state: { isGalleryProfile: boolean; isUploadProfile: boolean },
): boolean {
    if (section === "gallery") return state.isGalleryProfile;
    if (section === "upload") return state.isUploadProfile;
    return true;
}

export function sectionMatches(section: StudioSectionDefinition, query: string): boolean {
    const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    if (terms.length === 0) return true;
    const haystack = `${section.label} ${section.description} ${section.keywords}`.toLocaleLowerCase();
    return terms.every((term) => haystack.includes(term));
}

export function concretePreviewPath(path: string): string {
    return path.replace(/\[([^\]]+)\]/g, (_match, parameter: string) =>
        parameter.toLowerCase().includes("token") ? "preview-token" : `preview-${parameter.toLowerCase()}`,
    );
}

export function routeOptionLabel(path: string): string {
    if (path === "__global__") return "Entire site";
    return pageLabel(path);
}
