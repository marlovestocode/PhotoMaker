"use client";

import {
    galleryContentLimits,
    galleryContentSchema,
    type DesignTokens,
    type GalleryContent,
    type GalleryTextField,
} from "@/theme/design-system";
import {
    AccordionSection,
    Callout,
    ColorField,
    FieldGrid,
    PanelActions,
    RangeField,
    SelectField,
    StudioButton,
    TextField,
    ToggleField,
} from "../controls";

function countAside(count: number) {
    return <span className="studio-accordion__count">{count}</span>;
}

export function GalleryPanel({
    galleryContent,
    tokens,
    updateGalleryContent,
    resetGalleryContent,
}: {
    galleryContent: GalleryContent;
    tokens: DesignTokens;
    updateGalleryContent: <Key extends keyof GalleryContent>(key: Key, value: GalleryContent[Key]) => void;
    resetGalleryContent: (keys: Array<keyof GalleryContent>) => void;
}) {
    function text(field: GalleryTextField, label: string, multiline = false, hint?: string) {
        return (
            <TextField
                hint={hint}
                key={field}
                label={label}
                maxLength={galleryContentLimits[field]}
                multiline={multiline}
                onChange={(value) => updateGalleryContent(field, value)}
                showCount
                value={galleryContent[field]}
            />
        );
    }

    return (
        <div className="studio-panel-stack">
            <Callout tone="info">
                <p>
                    Gallery copy and layout are previewed live. Browser and search metadata updates
                    on the published page. Base colors, type, and page frame live under Foundation.
                </p>
            </Callout>

            <AccordionSection aside={countAside(2)} description="How the page appears in browsers and search." title="Metadata">
                <FieldGrid columns={1}>
                    {text("pageTitle", "Page title", false, "Shown in the browser tab and search results.")}
                    {text("pageDescription", "Page description", true, "Used by search engines and link previews.")}
                </FieldGrid>
            </AccordionSection>

            <AccordionSection
                aside={countAside(5)}
                defaultOpen
                description="Brand, wordmark, and section navigation."
                title="Masthead & navigation"
            >
                <FieldGrid columns={1}>
                    {text("brandName", "Brand name")}
                    {text("brandDescriptor", "Brand descriptor")}
                    {text("exhibitionNavLabel", "Exhibition link label")}
                    {text("collectionNavLabel", "Collection link label")}
                    {text("visitNavLabel", "Visit link label")}
                </FieldGrid>
            </AccordionSection>

            <AccordionSection
                aside={countAside(9)}
                description="The opening statement and cover collage."
                title="Exhibition introduction"
            >
                <FieldGrid columns={1}>
                    {text("exhibitionNumber", "Exhibition number")}
                    {text("statusLabel", "Status label")}
                    {text("workSingularLabel", "Singular work label")}
                    {text("workPluralLabel", "Plural work label")}
                    {text("heroTitle", "Headline")}
                    {text("heroEmphasis", "Emphasized headline")}
                    {text("heroDescription", "Introduction", true)}
                    {text("collageEmptyLabel", "Empty collage label")}
                    {text("photoOpenLabel", "Photo link label")}
                </FieldGrid>
            </AccordionSection>

            <AccordionSection
                aside={countAside(8)}
                description="The featured frame and the full collection."
                title="Featured & collection"
            >
                <FieldGrid columns={1}>
                    {text("featuredLabel", "Featured-work label")}
                    {text("featuredRoomLabel", "Featured room label")}
                    {text("featuredByline", "Featured byline")}
                    {text("featuredMeta", "Featured photo detail")}
                    {text("collectionLabel", "Collection eyebrow")}
                    {text("collectionTitle", "Collection heading")}
                    {text("photoSingularLabel", "Singular photo count label")}
                    {text("photoPluralLabel", "Plural photo count label")}
                </FieldGrid>
            </AccordionSection>

            <AccordionSection
                aside={countAside(8)}
                description="The closing message and empty states."
                title="Visit & closing note"
            >
                <FieldGrid columns={1}>
                    {text("visitLabel", "Visit eyebrow")}
                    {text("visitTitle", "Visit heading")}
                    {text("visitDescription", "Visit message", true)}
                    {text("visitLinkLabel", "Visit link label")}
                    {text("emptyTitle", "Empty collection heading")}
                    {text("emptyDescription", "Empty collection message", true)}
                    {text("footerNote", "Footer note")}
                    {text("backToTopLabel", "Back-to-top link")}
                </FieldGrid>
            </AccordionSection>

            <AccordionSection
                aside={countAside(9)}
                description="Section colors, independent of the base palette."
                title="Section colors"
            >
                <FieldGrid columns={1}>
                    <ColorField
                        label="Header background"
                        onChange={(value) => updateGalleryContent("headerBackground", value)}
                        value={galleryContent.headerBackground ?? tokens.background}
                    />
                    <ColorField
                        label="Exhibition section"
                        onChange={(value) => updateGalleryContent("heroBackground", value)}
                        value={galleryContent.heroBackground ?? tokens.background}
                    />
                    <ColorField
                        label="Featured section"
                        onChange={(value) => updateGalleryContent("featuredBackground", value)}
                        value={galleryContent.featuredBackground ?? tokens.background}
                    />
                    <ColorField
                        label="Collection section"
                        onChange={(value) => updateGalleryContent("collectionBackground", value)}
                        value={galleryContent.collectionBackground ?? tokens.surface}
                    />
                    <ColorField
                        label="Visit section"
                        onChange={(value) => updateGalleryContent("visitBackground", value)}
                        value={galleryContent.visitBackground ?? tokens.background}
                    />
                    <ColorField
                        label="Footer background"
                        onChange={(value) => updateGalleryContent("footerBackground", value)}
                        value={galleryContent.footerBackground ?? tokens.background}
                    />
                    <ColorField
                        label="Photo card background"
                        onChange={(value) => updateGalleryContent("photoCardBackground", value)}
                        value={galleryContent.photoCardBackground ?? tokens.surface}
                    />
                    <ColorField
                        label="Photo card border"
                        onChange={(value) => updateGalleryContent("photoCardBorder", value)}
                        value={galleryContent.photoCardBorder ?? tokens.borderColor}
                    />
                    <ColorField
                        label="Cover photo frame"
                        onChange={(value) => updateGalleryContent("collageFrameBackground", value)}
                        value={galleryContent.collageFrameBackground ?? tokens.surface}
                    />
                </FieldGrid>
            </AccordionSection>

            <AccordionSection
                aside={countAside(12)}
                description="Choose what appears and how the collection flows."
                title="Sections & layout"
            >
                <div className="studio-toggle-list">
                    <ToggleField
                        checked={galleryContent.showHeader}
                        label="Masthead and navigation"
                        onChange={(value) => updateGalleryContent("showHeader", value)}
                    />
                    <ToggleField
                        checked={galleryContent.showStatus}
                        label="Work count"
                        onChange={(value) => updateGalleryContent("showStatus", value)}
                    />
                    <ToggleField
                        checked={galleryContent.showCollage}
                        label="Layered cover collage"
                        onChange={(value) => updateGalleryContent("showCollage", value)}
                    />
                    <ToggleField
                        checked={galleryContent.showFeatured}
                        label="Featured photograph"
                        onChange={(value) => updateGalleryContent("showFeatured", value)}
                    />
                    <ToggleField
                        checked={galleryContent.showCollection}
                        label="Full collection"
                        onChange={(value) => updateGalleryContent("showCollection", value)}
                    />
                    <ToggleField
                        checked={galleryContent.showVisit}
                        label="Visit section"
                        onChange={(value) => updateGalleryContent("showVisit", value)}
                    />
                    <ToggleField
                        checked={galleryContent.showFooter}
                        label="Footer"
                        onChange={(value) => updateGalleryContent("showFooter", value)}
                    />
                </div>
                <FieldGrid columns={2}>
                    <SelectField
                        label="Collection layout"
                        onChange={(value) => updateGalleryContent("collectionLayout", value)}
                        options={[
                            { value: "grid", label: "Even grid" },
                            { value: "masonry", label: "Editorial masonry" },
                        ]}
                        value={galleryContent.collectionLayout}
                    />
                    <SelectField
                        label="Featured image"
                        onChange={(value) => updateGalleryContent("featureImageSide", value)}
                        options={[
                            { value: "left", label: "Image on left" },
                            { value: "right", label: "Image on right" },
                        ]}
                        value={galleryContent.featureImageSide}
                    />
                </FieldGrid>
                <FieldGrid columns={1}>
                    <RangeField
                        label="Collection columns"
                        max={5}
                        min={2}
                        onChange={(value) => updateGalleryContent("collectionColumns", value)}
                        unit=""
                        value={galleryContent.collectionColumns}
                    />
                    <RangeField
                        label="Cover collage photographs"
                        max={7}
                        min={3}
                        onChange={(value) => updateGalleryContent("collageImageCount", value)}
                        unit=""
                        value={galleryContent.collageImageCount}
                    />
                    <RangeField
                        label="Hero heading scale"
                        max={400}
                        min={150}
                        onChange={(value) => updateGalleryContent("heroScale", value)}
                        step={10}
                        unit="%"
                        value={galleryContent.heroScale}
                    />
                </FieldGrid>
            </AccordionSection>

            <PanelActions>
                <StudioButton
                    icon="restore"
                    onClick={() =>
                        resetGalleryContent(
                            Object.keys(galleryContentSchema.shape) as Array<keyof GalleryContent>,
                        )
                    }
                    size="sm"
                    variant="ghost"
                >
                    Reset gallery content
                </StudioButton>
            </PanelActions>
        </div>
    );
}
