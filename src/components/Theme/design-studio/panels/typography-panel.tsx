"use client";

import { designTokensToCss, type DesignTokens } from "@/theme/design-system";
import {
    AccordionSection,
    FieldGrid,
    PanelActions,
    RangeField,
    SegmentedControl,
    SelectField,
    StudioButton,
} from "../controls";
import { FONT_OPTIONS } from "../constants";

const TYPE_KEYS: Array<keyof DesignTokens> = [
    "headingFont",
    "bodyFont",
    "headingSize",
    "bodySize",
    "headingWeight",
    "lineHeight",
    "alignment",
];

export function TypographyPanel({
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
            <AccordionSection defaultOpen description="Fonts, scale, and reading rhythm." title="Type system">
                <FieldGrid columns={2}>
                    <SelectField
                        label="Heading font"
                        onChange={(value) => updateToken("headingFont", value)}
                        options={FONT_OPTIONS}
                        value={tokens.headingFont}
                    />
                    <SelectField
                        label="Body font"
                        onChange={(value) => updateToken("bodyFont", value)}
                        options={FONT_OPTIONS}
                        value={tokens.bodyFont}
                    />
                    <SelectField
                        label="Heading weight"
                        onChange={(value) => updateToken("headingWeight", value)}
                        options={[
                            { value: "normal", label: "Normal" },
                            { value: "semibold", label: "Semibold" },
                            { value: "bold", label: "Bold" },
                        ]}
                        value={tokens.headingWeight}
                    />
                    <div className="studio-field">
                        <span className="studio-field__label">Text alignment</span>
                        <SegmentedControl
                            label="Text alignment"
                            onChange={(value) => updateToken("alignment", value)}
                            options={[
                                { value: "left", label: "Left" },
                                { value: "center", label: "Centered" },
                            ]}
                            value={tokens.alignment}
                        />
                    </div>
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
                    <RangeField
                        label="Line height"
                        max={2.2}
                        min={1.2}
                        onChange={(value) => updateToken("lineHeight", value)}
                        step={0.1}
                        unit=""
                        value={tokens.lineHeight}
                    />
                </FieldGrid>
            </AccordionSection>

            <div className="studio-type-specimen" style={designTokensToCss(tokens)}>
                <p className="studio-type-specimen__eyebrow">Type specimen</p>
                <p className="studio-type-specimen__heading">Light, held still.</p>
                <p className="studio-type-specimen__body">
                    A small collection of photographs, stories, and everyday light. The best things
                    are better shared.
                </p>
            </div>

            <PanelActions>
                <StudioButton icon="restore" onClick={() => resetTokenSection(TYPE_KEYS)} size="sm" variant="ghost">
                    Reset typography
                </StudioButton>
            </PanelActions>
        </div>
    );
}
