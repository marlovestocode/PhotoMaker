import type { CSSProperties } from "react";
import { z } from "zod";

export const colorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const designBreakpoints = { mobileMax: 760, tabletMax: 1024 } as const;
export const elementPositionBounds = { min: -2400, max: 2400 } as const;

export const pageKeySchema = z
    .string()
    .min(1)
    .max(180)
    .regex(/^\/[A-Za-z0-9._~\[\]-]*(?:\/[A-Za-z0-9._~\[\]-]*)*$/)
    .refine((value) => !value.split("/").some((segment) => segment === "." || segment === ".."));
export const designElementLocatorSchema = z
    .string()
    .max(500)
    .regex(/^[a-z][a-z0-9-]*:\d+(?:\/[a-z][a-z0-9-]*:\d+)*$/);
export const designElementSizeSchema = z.object({
    width: z.number().int().min(16).max(2400).optional(),
    height: z.number().int().min(16).max(2400).optional(),
    fontSize: z.number().int().min(0).max(5000).optional(),
    x: withinPositionBounds().optional(),
    y: withinPositionBounds().optional(),
    color: colorSchema.optional(),
    backgroundColor: colorSchema.optional(),
    fontFamily: z.enum(["serif", "sans", "display", "monospace"]).optional(),
    fontWeight: z.enum(["normal", "500", "600", "700"]).optional(),
    textAlign: z.enum(["left", "center", "right", "justify"]).optional(),
    padding: z.number().int().min(0).max(240).optional(),
    borderRadius: z.number().int().min(0).max(240).optional(),
    borderColor: colorSchema.optional(),
    borderWidth: z.number().int().min(0).max(24).optional(),
    borderStyle: z.enum(["none", "solid", "double", "dashed"]).optional(),
    letterSpacing: z.number().min(-8).max(32).optional(),
    lineHeight: z.number().min(0.5).max(4).optional(),
    opacity: z.number().min(0).max(1).optional(),
    objectFit: z.enum(["cover", "contain", "fill", "none", "scale-down"]).optional(),
    textTransform: z.enum(["none", "uppercase", "lowercase", "capitalize"]).optional(),
});

function withinPositionBounds() {
    return z.number().int().min(elementPositionBounds.min).max(elementPositionBounds.max);
}

export const designTokensSchema = z.object({
    layout: z.enum(["classic", "editorial", "gallery", "wide"]),
    background: colorSchema,
    surface: colorSchema,
    text: colorSchema,
    muted: colorSchema,
    accent: colorSchema,
    borderColor: colorSchema,
    buttonBackground: colorSchema.default("#8b4513"),
    buttonText: colorSchema.default("#ffffff"),
    hoverBackground: colorSchema.default("#6b3410"),
    hoverText: colorSchema.default("#ffffff"),
    headingFont: z.enum(["serif", "sans", "display", "monospace"]),
    bodyFont: z.enum(["serif", "sans", "display", "monospace"]),
    headingSize: z.number().int().min(20).max(64),
    bodySize: z.number().int().min(12).max(24),
    headingWeight: z.enum(["normal", "semibold", "bold"]),
    lineHeight: z.number().min(1.2).max(2.2),
    alignment: z.enum(["left", "center"]),
    pageWidth: z.number().int().min(640).max(1600),
    pagePadding: z.number().int().min(12).max(96),
    uploadContentWidth: z.enum(["fluid", "contained"]).default("fluid"),
    sectionSpacing: z.number().int().min(8).max(96),
    cornerRadius: z.number().int().min(0).max(40),
    borderStyle: z.enum(["none", "solid", "double", "dashed"]),
    borderWidth: z.number().int().min(0).max(8),
    shadow: z.enum(["none", "soft", "strong"]),
});

export const designElementSizesSchema = z.record(designElementLocatorSchema, designElementSizeSchema);
export type DesignElementSizes = z.infer<typeof designElementSizesSchema>;
export type DesignElementSize = z.infer<typeof designElementSizeSchema>;
export const responsiveElementSizesSchema = z.object({
    tablet: designElementSizesSchema.optional(),
    mobile: designElementSizesSchema.optional(),
});
export type ResponsiveElementSizes = z.infer<typeof responsiveElementSizesSchema>;
export const designPreviewSelectionItemSchema = z.object({
    locator: designElementLocatorSchema,
    label: z.string().max(120),
    tag: z.string().regex(/^[a-z][a-z0-9-]*$/),
    width: z.number().int().min(0).max(5000),
    height: z.number().int().min(0).max(5000),
    fontSize: z.number().int().min(0).max(5000),
    color: colorSchema,
    backgroundColor: colorSchema.nullable(),
    fontFamily: z.enum(["serif", "sans", "display", "monospace"]),
    fontWeight: z.enum(["normal", "500", "600", "700"]),
    textAlign: z.enum(["left", "center", "right", "justify"]),
    padding: z.number().min(0).max(240),
    borderRadius: z.number().min(0).max(240),
    borderColor: colorSchema.nullable(),
    borderWidth: z.number().min(0).max(24),
    borderStyle: z.enum(["none", "solid", "double", "dashed"]),
    letterSpacing: z.number().min(-8).max(32),
    lineHeight: z.number().min(0.5).max(4),
    opacity: z.number().min(0).max(1),
    objectFit: z.enum(["cover", "contain", "fill", "none", "scale-down"]),
    textTransform: z.enum(["none", "uppercase", "lowercase", "capitalize"]),
    left: z.number().int().min(-10000).max(10000),
    top: z.number().int().min(-10000).max(10000),
    parentLeft: z.number().int().min(-10000).max(10000),
    parentTop: z.number().int().min(-10000).max(10000),
    parentWidth: z.number().int().min(0).max(10000),
    parentHeight: z.number().int().min(0).max(20000),
    pageLeft: z.number().int().min(-10000).max(10000),
    pageTop: z.number().int().min(-10000).max(10000),
    pageWidth: z.number().int().min(0).max(10000),
    pageHeight: z.number().int().min(0).max(20000),
    x: withinPositionBounds(),
    y: withinPositionBounds(),
});
export const designPreviewSelectionSchema = z.object({
    type: z.literal("photomaker:design-elements-selected"),
    selections: z.array(designPreviewSelectionItemSchema).max(50),
    positionsChanged: z.boolean(),
});
export type DesignPreviewSelection = z.infer<typeof designPreviewSelectionItemSchema>;
const galleryTextLimits = {
    pageTitle: 160,
    pageDescription: 500,
    brandName: 80,
    brandDescriptor: 80,
    exhibitionNavLabel: 80,
    collectionNavLabel: 80,
    visitNavLabel: 80,
    exhibitionNumber: 100,
    statusLabel: 80,
    workSingularLabel: 40,
    workPluralLabel: 40,
    heroTitle: 120,
    heroEmphasis: 120,
    heroDescription: 1000,
    collageEmptyLabel: 120,
    photoOpenLabel: 60,
    featuredLabel: 100,
    featuredRoomLabel: 80,
    featuredByline: 160,
    featuredMeta: 160,
    collectionLabel: 100,
    collectionTitle: 120,
    photoSingularLabel: 40,
    photoPluralLabel: 40,
    visitLabel: 100,
    visitTitle: 120,
    visitDescription: 1000,
    visitLinkLabel: 100,
    emptyTitle: 160,
    emptyDescription: 500,
    footerNote: 160,
    backToTopLabel: 80,
} as const satisfies Record<string, number>;

export type GalleryTextField = keyof typeof galleryTextLimits;
export const galleryContentLimits: Record<GalleryTextField, number> = galleryTextLimits;

function textFields(limits: typeof galleryTextLimits) {
    return Object.fromEntries(
        Object.entries(limits).map(([field, max]) => [field, z.string().max(max)]),
    ) as { [Field in keyof typeof limits]: z.ZodString };
}

export const galleryContentSchema = z.object({
    ...textFields(galleryTextLimits),
    headerBackground: colorSchema.optional(),
    heroBackground: colorSchema.optional(),
    featuredBackground: colorSchema.optional(),
    collectionBackground: colorSchema.optional(),
    visitBackground: colorSchema.optional(),
    footerBackground: colorSchema.optional(),
    photoCardBackground: colorSchema.optional(),
    photoCardBorder: colorSchema.optional(),
    collageFrameBackground: colorSchema.optional(),
    showHeader: z.boolean(),
    showStatus: z.boolean(),
    showCollage: z.boolean(),
    showFeatured: z.boolean(),
    showCollection: z.boolean(),
    showVisit: z.boolean(),
    showFooter: z.boolean(),
    collectionColumns: z.number().int().min(2).max(5),
    collectionLayout: z.enum(["grid", "masonry"]),
    featureImageSide: z.enum(["left", "right"]),
    collageImageCount: z.number().int().min(3).max(7),
    heroScale: z.number().int().min(150).max(400),
});
export const designPreviewControlMessageSchema = z.object({
    type: z.literal("photomaker:design-preview"),
    tokens: designTokensSchema,
    selecting: z.boolean(),
    elementSizes: designElementSizesSchema,
    responsiveElementSizes: responsiveElementSizesSchema,
    hiddenElements: z.array(designElementLocatorSchema).max(200),
    galleryContent: galleryContentSchema,
});

export const pageDesignOverridesSchema = designTokensSchema
    .partial()
    .extend({
        elementSizes: designElementSizesSchema.optional(),
        responsiveElementSizes: responsiveElementSizesSchema.optional(),
        hiddenElements: z.array(designElementLocatorSchema).max(200).optional(),
        galleryContent: galleryContentSchema.partial().optional(),
    });

export const defaultGalleryContent = {
    pageTitle: "A Gallery of Quiet Light | Photo Maker",
    pageDescription: "A rotating collection of photographs, gathered from the moments and places we want to remember.",
    brandName: "Halide",
    brandDescriptor: "Gallery",
    exhibitionNavLabel: "Exhibition",
    collectionNavLabel: "Collection",
    visitNavLabel: "Visit",
    exhibitionNumber: "Exhibition No. 14",
    statusLabel: "Now showing",
    workSingularLabel: "work",
    workPluralLabel: "works",
    heroTitle: "Light, held",
    heroEmphasis: "still.",
    heroDescription:
        "A rotating collection of photographs, gathered from the moments and places we want to remember.",
    collageEmptyLabel: "Photographs will appear here",
    photoOpenLabel: "View",
    featuredLabel: "Selected photograph",
    featuredRoomLabel: "Room 01",
    featuredByline: "A moment remembered",
    featuredMeta: "A photograph from the collection",
    collectionLabel: "The full collection",
    collectionTitle: "Every frame, on the wall.",
    photoSingularLabel: "photograph",
    photoPluralLabel: "photographs",
    visitLabel: "A note from our family",
    visitTitle: "The best things are better shared.",
    visitDescription:
        "A small collection of photographs, stories, and everyday light. Thank you for being here to see them.",
    visitLinkLabel: "Explore the collection",
    emptyTitle: "The next exhibition is taking shape.",
    emptyDescription: "Check back soon. New photographs will find their place here.",
    footerNote: "A family album, gathered with love.",
    backToTopLabel: "Back to the beginning",
    showHeader: true,
    showStatus: true,
    showCollage: true,
    showFeatured: true,
    showCollection: true,
    showVisit: true,
    showFooter: true,
    collectionColumns: 3,
    collectionLayout: "grid" as const,
    featureImageSide: "left" as const,
    collageImageCount: 5,
    heroScale: 330,
};

export type GalleryContent = z.infer<typeof galleryContentSchema>;

export const defaultDesignTokens: DesignTokens = {
    layout: "classic",
    background: "#faf9f7",
    surface: "#ffffff",
    text: "#292524",
    muted: "#78716c",
    accent: "#8b4513",
    borderColor: "#d6d3d1",
    buttonBackground: "#8b4513",
    buttonText: "#ffffff",
    hoverBackground: "#6b3410",
    hoverText: "#ffffff",
    headingFont: "serif",
    bodyFont: "sans",
    headingSize: 36,
    bodySize: 16,
    headingWeight: "semibold",
    lineHeight: 1.6,
    alignment: "left",
    pageWidth: 1152,
    pagePadding: 32,
    uploadContentWidth: "fluid",
    sectionSpacing: 32,
    cornerRadius: 16,
    borderStyle: "solid",
    borderWidth: 1,
    shadow: "soft",
};

export type DesignTokens = z.infer<typeof designTokensSchema>;
export type DesignTokenOverrides = Partial<DesignTokens>;

export const siteDesignSchema = z.object({
    global: designTokensSchema.default(defaultDesignTokens),
    pages: z.record(pageKeySchema, pageDesignOverridesSchema).default({}),
});

export type SiteDesign = z.infer<typeof siteDesignSchema>;

export const builtInLayoutPresets: Array<{ id: string; name: string; tokens: DesignTokens }> = [
    {
        id: "victorian",
        name: "Victorian",
        tokens: {
            ...defaultDesignTokens,
            layout: "classic",
            background: "#f5efe5",
            surface: "#fffaf1",
            text: "#39291f",
            muted: "#786451",
            accent: "#8b4513",
            borderColor: "#bda681",
            buttonBackground: "#8b4513",
            buttonText: "#ffffff",
            hoverBackground: "#6b3410",
            hoverText: "#ffffff",
            headingFont: "serif",
            bodyFont: "serif",
            alignment: "center",
            borderStyle: "double",
            borderWidth: 4,
            cornerRadius: 8,
        },
    },
    {
        id: "medieval",
        name: "Medieval",
        tokens: {
            ...defaultDesignTokens,
            layout: "wide",
            background: "#ede9dc",
            surface: "#f9f6eb",
            text: "#2e352a",
            muted: "#66705a",
            accent: "#53643b",
            borderColor: "#89906f",
            buttonBackground: "#53643b",
            buttonText: "#ffffff",
            hoverBackground: "#38452a",
            hoverText: "#ffffff",
            headingFont: "serif",
            bodyFont: "serif",
            alignment: "left",
            borderStyle: "solid",
            borderWidth: 2,
            cornerRadius: 4,
        },
    },
    {
        id: "draconian",
        name: "Draconian",
        tokens: {
            ...defaultDesignTokens,
            layout: "gallery",
            background: "#211d1b",
            surface: "#302925",
            text: "#fff5e8",
            muted: "#c3b4a3",
            accent: "#d76035",
            borderColor: "#78513e",
            buttonBackground: "#d76035",
            buttonText: "#ffffff",
            hoverBackground: "#211d1b",
            hoverText: "#fff5e8",
            headingFont: "display",
            bodyFont: "sans",
            headingWeight: "bold",
            alignment: "center",
            borderStyle: "solid",
            borderWidth: 1,
            cornerRadius: 20,
            shadow: "strong",
        },
    },
    {
        id: "editorial",
        name: "Minimal editorial",
        tokens: {
            ...defaultDesignTokens,
            layout: "editorial",
            background: "#f7f7f5",
            surface: "#ffffff",
            text: "#202422",
            muted: "#686f6b",
            accent: "#356b5b",
            borderColor: "#d9dfdb",
            buttonBackground: "#356b5b",
            buttonText: "#ffffff",
            hoverBackground: "#285244",
            hoverText: "#ffffff",
            headingFont: "sans",
            bodyFont: "sans",
            headingWeight: "bold",
            alignment: "left",
            borderStyle: "solid",
            borderWidth: 1,
            cornerRadius: 12,
            shadow: "none",
        },
    },
];

const fontStacks = {
    serif: 'Georgia, "Times New Roman", serif',
    sans: 'Arial, Helvetica, sans-serif',
    display: '"Trebuchet MS", Arial, sans-serif',
    monospace: '"Courier New", monospace',
} satisfies Record<DesignTokens["headingFont"], string>;

const shadows = {
    none: "none",
    soft: "0 12px 35px rgb(41 37 36 / 8%)",
    strong: "0 16px 45px rgb(0 0 0 / 28%)",
} satisfies Record<DesignTokens["shadow"], string>;

function matchingPageOverride(design: SiteDesign, pathname: string): SiteDesign["pages"][string] | undefined {
    return Object.entries(design.pages)
        .filter(([pageKey]) => pageKeyMatches(pageKey, pathname))
        .sort(([left], [right]) => routeSpecificity(right) - routeSpecificity(left))[0]?.[1];
}

export function resolveDesignTokens(design: SiteDesign, pathname: string): DesignTokens {
    const page = matchingPageOverride(design, pathname);
    if (!page) {
        return design.global;
    }

    const tokenOverrides = designTokensSchema.partial().safeParse(page);
    return tokenOverrides.success ? { ...design.global, ...tokenOverrides.data } : design.global;
}

export function resolvePageDesignOverrides(design: SiteDesign, pathname: string) {
    return matchingPageOverride(design, pathname);
}

export function pageKeyMatches(pattern: string, pathname: string): boolean {
    const patternSegments = pattern.split("/").filter(Boolean);
    const pathSegments = pathname.split("/").filter(Boolean);

    return (
        patternSegments.length === pathSegments.length &&
        patternSegments.every((segment, index) =>
            /^\[[^\]]+\]$/.test(segment) ? pathSegments[index].length > 0 : segment === pathSegments[index],
        )
    );
}

function routeSpecificity(pattern: string): number {
    return pattern.split("/").filter((segment) => segment && !/^\[[^\]]+\]$/.test(segment)).length;
}

export function relativeLuminance(hex: string): number {
    const channels = hex.match(/[0-9a-f]{2}/gi)?.map((channel) => parseInt(channel, 16) / 255) ?? [];
    const [red = 0, green = 0, blue = 0] = channels;
    const linearize = (channel: number) =>
        channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    return linearize(red) * 0.2126 + linearize(green) * 0.7152 + linearize(blue) * 0.0722;
}

export function designTokensToCss(tokens: DesignTokens): CSSProperties {
    return {
        "--site-layout": tokens.layout,
        "--site-background": tokens.background,
        "--site-surface": tokens.surface,
        "--site-text": tokens.text,
        "--site-muted": tokens.muted,
        "--site-accent": tokens.accent,
        "--site-border-color": tokens.borderColor,
        "--site-button-background": tokens.buttonBackground,
        "--site-button-text": tokens.buttonText,
        "--site-hover-background": tokens.hoverBackground,
        "--site-hover-text": tokens.hoverText,
        "--site-heading-font": fontStacks[tokens.headingFont],
        "--site-body-font": fontStacks[tokens.bodyFont],
        "--site-heading-size": `${tokens.headingSize}px`,
        "--site-heading-scale": String(tokens.headingSize / 36),
        "--site-body-size": `${tokens.bodySize}px`,
        "--site-body-scale": String(tokens.bodySize / 16),
        "--site-heading-weight": tokens.headingWeight === "semibold" ? "600" : tokens.headingWeight,
        "--site-line-height": String(tokens.lineHeight),
        "--site-alignment": tokens.alignment,
        "--site-page-width": `${tokens.pageWidth}px`,
        "--site-page-padding": `${tokens.pagePadding}px`,
        "--site-section-spacing": `${tokens.sectionSpacing}px`,
        "--site-corner-radius": `${tokens.cornerRadius}px`,
        "--site-border-style": tokens.borderStyle,
        "--site-border-width": `${tokens.borderWidth}px`,
        "--site-shadow": shadows[tokens.shadow],
    } as CSSProperties;
}

export function designElementOverridesToCss(
    elementSizes: DesignElementSizes,
    hiddenElements: string[],
    responsiveElementSizes: ResponsiveElementSizes = {},
): string {
    function toGeometryDeclarations(size: DesignElementSizes[string]) {
        const declarations: string[] = [];
        if (size.width !== undefined) declarations.push(`width: ${size.width}px !important`);
        if (size.height !== undefined) declarations.push(`height: ${size.height}px !important`);
        if (size.fontSize !== undefined) declarations.push(`font-size: ${size.fontSize}px !important`);
        if (size.x !== undefined || size.y !== undefined) {
            declarations.push(`translate: ${size.x ?? 0}px ${size.y ?? 0}px !important`);
        }
        if (size.padding !== undefined) declarations.push(`padding: ${size.padding}px !important`);
        if (size.letterSpacing !== undefined) declarations.push(`letter-spacing: ${size.letterSpacing}px !important`);
        if (size.lineHeight !== undefined) declarations.push(`line-height: ${size.lineHeight} !important`);
        return declarations;
    }

    function toStyleDeclarations(size: DesignElementSizes[string]) {
        const declarations: string[] = [];
        if (size.color !== undefined) declarations.push(`color: ${size.color} !important`);
        if (size.backgroundColor !== undefined) declarations.push(`background-color: ${size.backgroundColor} !important`);
        if (size.fontFamily !== undefined) declarations.push(`font-family: ${fontStacks[size.fontFamily]} !important`);
        if (size.fontWeight !== undefined) declarations.push(`font-weight: ${size.fontWeight} !important`);
        if (size.textAlign !== undefined) declarations.push(`text-align: ${size.textAlign} !important`);
        if (size.borderRadius !== undefined) declarations.push(`border-radius: ${size.borderRadius}px !important`);
        if (size.borderColor !== undefined) declarations.push(`border-color: ${size.borderColor} !important`);
        if (size.borderWidth !== undefined) declarations.push(`border-width: ${size.borderWidth}px !important`);
        if (size.borderStyle !== undefined) declarations.push(`border-style: ${size.borderStyle} !important`);
        if (size.opacity !== undefined) declarations.push(`opacity: ${size.opacity} !important`);
        if (size.objectFit !== undefined) declarations.push(`object-fit: ${size.objectFit} !important`);
        if (size.textTransform !== undefined) declarations.push(`text-transform: ${size.textTransform} !important`);
        return declarations;
    }

    function rulesForSizes(sizes: DesignElementSizes, declarationsForSize: (size: DesignElementSizes[string]) => string[]): string[] {
        return Object.entries(sizes).flatMap(([locator, size]) => {
            const selector = designElementLocatorToCssSelector(locator);
            if (!selector) return [];
            const declarations = declarationsForSize(size);
            return declarations.length > 0
                ? [`.site-design-shell > ${selector} { ${declarations.join("; ")}; }`]
                : [];
        });
    }

    const rules = rulesForSizes(elementSizes, toStyleDeclarations);
    const desktopGeometryRules = rulesForSizes(elementSizes, toGeometryDeclarations);
    if (desktopGeometryRules.length > 0) {
        rules.push(`@media (min-width: 1025px) {\n${desktopGeometryRules.join("\n")}\n}`);
    }

    for (const locator of hiddenElements) {
        const selector = designElementLocatorToCssSelector(locator);
        if (selector) {
            rules.push(`.site-design-shell > ${selector} { display: none !important; }`);
        }
    }

    for (const breakpoint of ["tablet", "mobile"] as const) {
        const breakpointRules = rulesForSizes(responsiveElementSizes[breakpoint] ?? {}, (size) => [
            ...toGeometryDeclarations(size),
            ...toStyleDeclarations(size),
        ]);
        if (breakpointRules.length > 0) {
            const media = breakpoint === "tablet"
                ? `(min-width: ${designBreakpoints.mobileMax + 1}px) and (max-width: ${designBreakpoints.tabletMax}px)`
                : `(max-width: ${designBreakpoints.mobileMax}px)`;
            rules.push(`@media ${media} {\n${breakpointRules.join("\n")}\n}`);
        }
    }

    return rules.filter(Boolean).join("\n");
}

function designElementLocatorToCssSelector(locator: string): string | null {
    if (!designElementLocatorSchema.safeParse(locator).success) {
        return null;
    }

    return locator
        .split("/")
        .map((segment) => {
            const separator = segment.lastIndexOf(":");
            const tag = segment.slice(0, separator);
            const index = Number(segment.slice(separator + 1));
            return `${tag}:nth-of-type(${index + 1})`;
        })
        .join(" > ");
}
