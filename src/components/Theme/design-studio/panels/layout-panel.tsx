"use client";

import { designTokensToCss, type DesignTokens } from "@/theme/design-system";
import {
    AccordionSection,
    FieldGrid,
    PanelActions,
    RangeField,
    SelectField,
    StudioButton,
} from "../controls";

const LAYOUT_KEYS: Array<keyof DesignTokens> = [
    "layout",
    "pageWidth",
    "pagePadding",
    "sectionSpacing",
    "cornerRadius",
    "borderStyle",
    "borderWidth",
    "shadow",
];

export function LayoutPanel({
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
            <AccordionSection defaultOpen description="How pages compose and breathe." title="Page frame">
                <SelectField
                    hint="Presets choose a starting composition; you can still adjust every value."
                    label="Composition"
                    onChange={(value) => updateToken("layout", value)}
                    options={[
                        { value: "classic", label: "Classic · centered" },
                        { value: "editorial", label: "Editorial · asymmetric" },
                        { value: "gallery", label: "Gallery · roomy" },
                        { value: "wide", label: "Wide · expansive" },
                    ]}
                    value={tokens.layout}
                />
                <FieldGrid columns={1}>
                    <RangeField
                        label="Content width"
                        max={1600}
                        min={640}
                        onChange={(value) => updateToken("pageWidth", value)}
                        step={16}
                        unit="px"
                        value={tokens.pageWidth}
                    />
                    <RangeField
                        label="Page side padding"
                        max={96}
                        min={12}
                        onChange={(value) => updateToken("pagePadding", value)}
                        unit="px"
                        value={tokens.pagePadding}
                    />
                    <RangeField
                        label="Section spacing"
                        max={96}
                        min={8}
                        onChange={(value) => updateToken("sectionSpacing", value)}
                        unit="px"
                        value={tokens.sectionSpacing}
                    />
                </FieldGrid>
            </AccordionSection>

            <AccordionSection defaultOpen description="Edges and depth across surfaces." title="Shape & depth">
                <FieldGrid columns={1}>
                    <RangeField
                        label="Corner roundness"
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
                <FieldGrid columns={2}>
                    <SelectField
                        label="Border style"
                        onChange={(value) => updateToken("borderStyle", value)}
                        options={[
                            { value: "none", label: "None" },
                            { value: "solid", label: "Solid" },
                            { value: "double", label: "Double" },
                            { value: "dashed", label: "Dashed" },
                        ]}
                        value={tokens.borderStyle}
                    />
                    <SelectField
                        label="Shadow"
                        onChange={(value) => updateToken("shadow", value)}
                        options={[
                            { value: "none", label: "None" },
                            { value: "soft", label: "Soft" },
                            { value: "strong", label: "Strong" },
                        ]}
                        value={tokens.shadow}
                    />
                </FieldGrid>
                <div className="studio-shape-preview" style={designTokensToCss(tokens)}>
                    <div className="studio-shape-preview__card">
                        <span className="studio-shape-preview__eyebrow">Surface</span>
                        <span className="studio-shape-preview__title">A quiet frame</span>
                        <span className="studio-shape-preview__body">
                            Corners, borders, and shadow update live.
                        </span>
                    </div>
                </div>
            </AccordionSection>

            <PanelActions>
                <StudioButton icon="restore" onClick={() => resetTokenSection(LAYOUT_KEYS)} size="sm" variant="ghost">
                    Reset layout & shape
                </StudioButton>
            </PanelActions>
        </div>
    );
}
