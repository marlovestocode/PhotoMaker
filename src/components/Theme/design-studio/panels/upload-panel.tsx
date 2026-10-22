"use client";

import type { DesignTokens } from "@/theme/design-system";
import {
    AccordionSection,
    Callout,
    ColorField,
    FieldGrid,
    PanelActions,
    RangeField,
    SelectField,
    StudioButton,
} from "../controls";
import { FONT_OPTIONS } from "../constants";

const UPLOAD_KEYS: Array<keyof DesignTokens> = [
    "background",
    "surface",
    "text",
    "muted",
    "accent",
    "borderColor",
    "buttonBackground",
    "buttonText",
    "hoverBackground",
    "hoverText",
    "headingFont",
    "bodyFont",
    "headingSize",
    "bodySize",
    "uploadContentWidth",
    "pageWidth",
    "pagePadding",
    "cornerRadius",
    "borderWidth",
    "shadow",
];

export function UploadPanel({
    tokens,
    updateToken,
    resetTokenSection,
}: {
    tokens: DesignTokens;
    updateToken: <Key extends keyof DesignTokens>(key: Key, value: DesignTokens[Key]) => void;
    resetTokenSection: (keys: Array<keyof DesignTokens>) => void;
}) {
    return (
        <div className="studio-panel-stack">
            <Callout tone="info">
                <p>
                    These styles apply only to the photo studio. Upload forms, photo cards, and the
                    library inherit them.
                </p>
            </Callout>

            <AccordionSection defaultOpen description="Surfaces and actions for the upload workspace." title="Palette">
                <FieldGrid columns={1}>
                    <ColorField
                        label="Page background"
                        onChange={(value) => updateToken("background", value)}
                        value={tokens.background}
                    />
                    <ColorField
                        label="Panel background"
                        onChange={(value) => updateToken("surface", value)}
                        value={tokens.surface}
                    />
                    <ColorField
                        label="Primary text"
                        onChange={(value) => updateToken("text", value)}
                        value={tokens.text}
                    />
                    <ColorField
                        label="Secondary text"
                        onChange={(value) => updateToken("muted", value)}
                        value={tokens.muted}
                    />
                    <ColorField
                        label="Accent & focus"
                        onChange={(value) => updateToken("accent", value)}
                        value={tokens.accent}
                    />
                    <ColorField
                        label="Borders"
                        onChange={(value) => updateToken("borderColor", value)}
                        value={tokens.borderColor}
                    />
                    <ColorField
                        label="Primary button"
                        onChange={(value) => updateToken("buttonBackground", value)}
                        value={tokens.buttonBackground}
                    />
                    <ColorField
                        label="Primary button text"
                        onChange={(value) => updateToken("buttonText", value)}
                        value={tokens.buttonText}
                    />
                    <ColorField
                        label="Button hover"
                        onChange={(value) => updateToken("hoverBackground", value)}
                        value={tokens.hoverBackground}
                    />
                    <ColorField
                        label="Button hover text"
                        onChange={(value) => updateToken("hoverText", value)}
                        value={tokens.hoverText}
                    />
                </FieldGrid>
            </AccordionSection>

            <AccordionSection defaultOpen description="Form and library typography." title="Typography">
                <FieldGrid columns={2}>
                    <SelectField
                        label="Headings"
                        onChange={(value) => updateToken("headingFont", value)}
                        options={FONT_OPTIONS}
                        value={tokens.headingFont}
                    />
                    <SelectField
                        label="Form & body"
                        onChange={(value) => updateToken("bodyFont", value)}
                        options={FONT_OPTIONS}
                        value={tokens.bodyFont}
                    />
                </FieldGrid>
                <FieldGrid columns={1}>
                    <RangeField
                        label="Heading size"
                        max={64}
                        min={20}
                        onChange={(value) => updateToken("headingSize", value)}
                        unit="px"
                        value={tokens.headingSize}
                    />
                    <RangeField
                        label="Body size"
                        max={24}
                        min={12}
                        onChange={(value) => updateToken("bodySize", value)}
                        unit="px"
                        value={tokens.bodySize}
                    />
                </FieldGrid>
            </AccordionSection>

            <AccordionSection defaultOpen description="Width, spacing, and panel depth." title="Composition">
                <SelectField
                    hint="Contained uses the content width below; fluid fills the viewport."
                    label="Upload width"
                    onChange={(value) => updateToken("uploadContentWidth", value)}
                    options={[
                        { value: "fluid", label: "Fluid · fill the viewport" },
                        { value: "contained", label: "Contained · use content width" },
                    ]}
                    value={tokens.uploadContentWidth}
                />
                <FieldGrid columns={1}>
                    {tokens.uploadContentWidth === "contained" && (
                        <RangeField
                            label="Content width"
                            max={1600}
                            min={640}
                            onChange={(value) => updateToken("pageWidth", value)}
                            step={16}
                            unit="px"
                            value={tokens.pageWidth}
                        />
                    )}
                    <RangeField
                        label="Page side padding"
                        max={96}
                        min={12}
                        onChange={(value) => updateToken("pagePadding", value)}
                        unit="px"
                        value={tokens.pagePadding}
                    />
                    <RangeField
                        label="Panel corners"
                        max={40}
                        min={0}
                        onChange={(value) => updateToken("cornerRadius", value)}
                        unit="px"
                        value={tokens.cornerRadius}
                    />
                    <RangeField
                        label="Border thickness"
                        max={8}
                        min={0}
                        onChange={(value) => updateToken("borderWidth", value)}
                        unit="px"
                        value={tokens.borderWidth}
                    />
                </FieldGrid>
                <SelectField
                    label="Panel shadow"
                    onChange={(value) => updateToken("shadow", value)}
                    options={[
                        { value: "none", label: "None" },
                        { value: "soft", label: "Soft" },
                        { value: "strong", label: "Strong" },
                    ]}
                    value={tokens.shadow}
                />
            </AccordionSection>

            <PanelActions>
                <StudioButton icon="restore" onClick={() => resetTokenSection(UPLOAD_KEYS)} size="sm" variant="ghost">
                    Reset photo studio styles
                </StudioButton>
            </PanelActions>
        </div>
    );
}
