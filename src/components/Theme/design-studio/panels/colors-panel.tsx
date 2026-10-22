"use client";

import { designTokensToCss, type DesignTokens } from "@/theme/design-system";
import {
    AccordionSection,
    Callout,
    ColorField,
    FieldGrid,
    PanelActions,
    StudioButton,
} from "../controls";
import { StudioIcon } from "../icons";

const COLOR_KEYS: Array<keyof DesignTokens> = [
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
];

export function ColorsPanel({
    tokens,
    updateToken,
    resetTokenSection,
    contrastWarnings,
}: {
    tokens: DesignTokens;
    updateToken: (key: keyof DesignTokens, value: DesignTokens[keyof DesignTokens]) => void;
    resetTokenSection: (keys: Array<keyof DesignTokens>) => void;
    contrastWarnings: Array<{ label: string; ratio: number }>;
}) {
    return (
        <div className="studio-panel-stack">
            <AccordionSection
                defaultOpen
                description="The quiet foundation every page inherits."
                title="Palette"
            >
                <FieldGrid columns={1}>
                    <ColorField
                        label="Page background"
                        onChange={(value) => updateToken("background", value)}
                        value={tokens.background}
                    />
                    <ColorField
                        label="Card & panel surface"
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
                        label="Accent"
                        onChange={(value) => updateToken("accent", value)}
                        value={tokens.accent}
                    />
                    <ColorField
                        label="Borders & rules"
                        onChange={(value) => updateToken("borderColor", value)}
                        value={tokens.borderColor}
                    />
                </FieldGrid>
            </AccordionSection>

            <AccordionSection
                defaultOpen
                description="How primary actions read across the site."
                title="Actions"
            >
                <FieldGrid columns={1}>
                    <ColorField
                        label="Button background"
                        onChange={(value) => updateToken("buttonBackground", value)}
                        value={tokens.buttonBackground}
                    />
                    <ColorField
                        label="Button text"
                        onChange={(value) => updateToken("buttonText", value)}
                        value={tokens.buttonText}
                    />
                    <ColorField
                        label="Hover background"
                        onChange={(value) => updateToken("hoverBackground", value)}
                        value={tokens.hoverBackground}
                    />
                    <ColorField
                        label="Hover text"
                        onChange={(value) => updateToken("hoverText", value)}
                        value={tokens.hoverText}
                    />
                </FieldGrid>
                <div className="studio-button-preview" style={designTokensToCss(tokens)}>
                    <span className="studio-button-preview__label">Button preview</span>
                    <span className="studio-button-preview__sample">Primary action</span>
                    <span className="studio-button-preview__hover">Hover</span>
                </div>
            </AccordionSection>

            {contrastWarnings.length > 0 ? (
                <Callout role="status" tone="warning" title="Contrast may be hard to read">
                    <p>
                        {contrastWarnings
                            .map(({ label, ratio }) => `${label} (${ratio.toFixed(2)}:1)`)
                            .join(", ")}{" "}
                        falls below the 4.5:1 readability target.
                    </p>
                </Callout>
            ) : (
                <Callout tone="success" title="Readable pairings">
                    <p>Your text and button pairings meet the 4.5:1 contrast target.</p>
                </Callout>
            )}

            <PanelActions>
                <StudioButton icon="restore" onClick={() => resetTokenSection(COLOR_KEYS)} size="sm" variant="ghost">
                    Reset colors
                </StudioButton>
                <span className="studio-hint">
                    <StudioIcon name="info" size={13} /> Hex values accept six-digit colors.
                </span>
            </PanelActions>
        </div>
    );
}
