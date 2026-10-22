"use client";

import { memo } from "react";
import type {
    DesignElementSize,
    DesignPreviewSelection,
    DesignTokens,
} from "@/theme/design-system";
import {
    AccordionSection,
    Badge,
    Callout,
    ColorField,
    FieldGrid,
    NumberField,
    RangeField,
    SelectField,
    StudioButton,
    cx,
} from "./controls";
import { FONT_OPTIONS, pageLabel } from "./constants";
import { StudioIcon } from "./icons";
import type { ElementBreakpoint } from "./types";

const TEXT_TAGS = new Set([
    "a",
    "blockquote",
    "button",
    "dd",
    "dt",
    "em",
    "figcaption",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "label",
    "li",
    "p",
    "small",
    "span",
    "strong",
    "summary",
]);

type ElementStyleKey = keyof DesignElementSize;

export const ElementInspector = memo(function ElementInspector({
    selectedElement,
    selectedElements,
    selectedElementSize,
    selectedWidth,
    selectedHeight,
    selectedFontSize,
    selectedX,
    selectedY,
    selectedColor,
    selectedBackgroundColor,
    selectedBorderColor,
    hasSelectedElementOverrides,
    activeBreakpoint,
    previewDraft,
    previewPage,
    tokens,
    selectingElements,
    removedElements,
    updateSelectedElementSize,
    resetSelectedElementSize,
    deleteSelectedElement,
    toggleSelecting,
    alignSelection,
    centerSelectionInPage,
    distributeSelection,
    resetSelectedPositions,
    onOpenTools,
    onClose,
}: {
    selectedElement: DesignPreviewSelection | null;
    selectedElements: DesignPreviewSelection[];
    selectedElementSize: DesignElementSize | undefined;
    selectedWidth: number;
    selectedHeight: number;
    selectedFontSize: number;
    selectedX: number;
    selectedY: number;
    selectedColor: string | undefined;
    selectedBackgroundColor: string | undefined;
    selectedBorderColor: string | undefined;
    hasSelectedElementOverrides: boolean;
    activeBreakpoint: ElementBreakpoint;
    previewDraft: boolean;
    previewPage: string;
    tokens: DesignTokens;
    selectingElements: boolean;
    removedElements: string[];
    updateSelectedElementSize: (property: ElementStyleKey, value: DesignElementSize[ElementStyleKey] | undefined) => void;
    resetSelectedElementSize: () => void;
    deleteSelectedElement: () => void;
    toggleSelecting: () => void;
    alignSelection: (axis: "horizontal" | "vertical", edge: "start" | "center" | "end") => void;
    centerSelectionInPage: (axis: "horizontal" | "vertical") => void;
    distributeSelection: (axis: "horizontal" | "vertical") => void;
    resetSelectedPositions: () => void;
    onOpenTools: () => void;
    onClose?: () => void;
}) {
    const selectionCount = selectedElements.length;
    const isText = selectedElement ? TEXT_TAGS.has(selectedElement.tag) : false;
    const allText = selectedElements.length > 0 && selectedElements.every((element) => TEXT_TAGS.has(element.tag));
    const isImage = selectedElements.length > 0 && selectedElements.every((element) => element.tag === "img");
    const hasPosition = selectedElements.some((element) => element.x !== 0 || element.y !== 0);

    return (
        <aside aria-label="Element inspector" className="studio-inspector">
            <header className="studio-inspector__header">
                <div>
                    <p className="studio-eyebrow">Inspector</p>
                    <h2 className="studio-inspector__title">
                        {selectionCount === 0
                            ? "Nothing selected"
                            : selectionCount === 1
                              ? "Selected element"
                              : `${selectionCount} elements`}
                    </h2>
                </div>
                <div className="studio-inspector__header-actions">
                    <Badge tone="neutral">{activeBreakpoint}</Badge>
                    {onClose && (
                        <button
                            aria-label="Close element inspector"
                            className="studio-icon-button"
                            onClick={onClose}
                            title="Close element inspector"
                            type="button"
                        >
                            <StudioIcon name="close" size={16} />
                        </button>
                    )}
                </div>
            </header>

            <div className="studio-inspector__scroll">
                {!selectedElement ? (
                    <div className="studio-inspector__empty">
                        <span aria-hidden="true" className="studio-inspector__empty-icon">
                            <StudioIcon name="cursor" size={22} />
                        </span>
                        <h3>Select something to style</h3>
                        <p>
                            Choose any element in the live preview and only its relevant controls will
                            appear here.
                        </p>
                        <StudioButton
                            disabled={!previewDraft}
                            icon="cursor"
                            onClick={toggleSelecting}
                            variant={selectingElements ? "primary" : "secondary"}
                        >
                            {!previewDraft
                                ? "Switch preview to Draft"
                                : selectingElements
                                  ? "Stop selecting"
                                  : "Select an element"}
                        </StudioButton>

                        <div className="studio-inspector__guide">
                            <p className="studio-inspector__guide-title">How selection works</p>
                            <ul>
                                <li>
                                    <StudioIcon name="cursor" size={14} /> Click an element to select it.
                                </li>
                                <li>
                                    <StudioIcon name="layers" size={14} /> Ctrl-click or Cmd-click to
                                    select several.
                                </li>
                                <li>
                                    <StudioIcon name="sliders" size={14} /> Drag a selected element to
                                    reposition it.
                                </li>
                            </ul>
                        </div>

                        {removedElements.length > 0 && (
                            <button className="studio-link studio-inspector__restore-link" onClick={onOpenTools} type="button">
                                <StudioIcon name="restore" size={14} />
                                {removedElements.length} removed element
                                {removedElements.length === 1 ? "" : "s"} can be restored
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="studio-inspector__content">
                        <div className="studio-selection-card">
                            <div className="studio-selection-card__meta">
                                <span className="studio-selection-card__tag">{selectedElement.tag}</span>
                                <span className="studio-selection-card__label">
                                    {selectionCount === 1
                                        ? selectedElement.label
                                        : `${selectionCount} elements selected`}
                                </span>
                            </div>
                            <p className="studio-selection-card__scope">
                                {pageLabel(previewPage)} · {activeBreakpoint}
                            </p>
                            <div className="studio-selection-card__actions">
                                <StudioButton
                                    disabled={!hasSelectedElementOverrides}
                                    icon="restore"
                                    onClick={resetSelectedElementSize}
                                    size="sm"
                                    variant="ghost"
                                >
                                    Reset styling
                                </StudioButton>
                                <StudioButton
                                    icon="trash"
                                    onClick={deleteSelectedElement}
                                    size="sm"
                                    variant="ghost-danger"
                                >
                                    Remove
                                </StudioButton>
                            </div>
                        </div>

                        <AccordionSection defaultOpen description={`Applies to ${activeBreakpoint}`} title="Position & size">
                            <FieldGrid>
                                <NumberField
                                    label="Width"
                                    max={2400}
                                    min={16}
                                    onChange={(value) => updateSelectedElementSize("width", value)}
                                    unit="px"
                                    value={selectedWidth}
                                />
                                <NumberField
                                    label="Height"
                                    max={2400}
                                    min={16}
                                    onChange={(value) => updateSelectedElementSize("height", value)}
                                    unit="px"
                                    value={selectedHeight}
                                />
                                <NumberField
                                    label="Horizontal"
                                    max={2400}
                                    min={-2400}
                                    onChange={(value) => updateSelectedElementSize("x", value)}
                                    unit="px"
                                    value={selectedX}
                                />
                                <NumberField
                                    label="Vertical"
                                    max={2400}
                                    min={-2400}
                                    onChange={(value) => updateSelectedElementSize("y", value)}
                                    unit="px"
                                    value={selectedY}
                                />
                            </FieldGrid>
                            {hasPosition && (
                                <button
                                    className="studio-link studio-link--small"
                                    onClick={resetSelectedPositions}
                                    type="button"
                                >
                                    Reset position
                                </button>
                            )}
                        </AccordionSection>

                        {allText && (
                            <AccordionSection defaultOpen title="Typography">
                                <FieldGrid>
                                    <SelectField
                                        label="Font"
                                        onChange={(value) =>
                                            updateSelectedElementSize(
                                                "fontFamily",
                                                value === "inherit"
                                                    ? undefined
                                                    : (value as DesignTokens["headingFont"]),
                                            )
                                        }
                                        options={[
                                            { value: "inherit", label: "Inherit" },
                                            ...FONT_OPTIONS,
                                        ]}
                                        value={selectedElementSize?.fontFamily ?? "inherit"}
                                    />
                                    <SelectField
                                        label="Weight"
                                        onChange={(value) =>
                                            updateSelectedElementSize(
                                                "fontWeight",
                                                value === "inherit"
                                                    ? undefined
                                                    : (value as NonNullable<DesignElementSize["fontWeight"]>),
                                            )
                                        }
                                        options={[
                                            { value: "inherit", label: "Inherit" },
                                            { value: "normal", label: "Normal" },
                                            { value: "500", label: "Medium" },
                                            { value: "600", label: "Semibold" },
                                            { value: "700", label: "Bold" },
                                        ]}
                                        value={selectedElementSize?.fontWeight ?? "inherit"}
                                    />
                                    <SelectField
                                        label="Alignment"
                                        onChange={(value) =>
                                            updateSelectedElementSize(
                                                "textAlign",
                                                value === "inherit"
                                                    ? undefined
                                                    : (value as NonNullable<DesignElementSize["textAlign"]>),
                                            )
                                        }
                                        options={[
                                            { value: "inherit", label: "Inherit" },
                                            { value: "left", label: "Left" },
                                            { value: "center", label: "Center" },
                                            { value: "right", label: "Right" },
                                            { value: "justify", label: "Justify" },
                                        ]}
                                        value={selectedElementSize?.textAlign ?? "inherit"}
                                    />
                                    <SelectField
                                        label="Transform"
                                        onChange={(value) =>
                                            updateSelectedElementSize(
                                                "textTransform",
                                                value === "inherit"
                                                    ? undefined
                                                    : (value as NonNullable<DesignElementSize["textTransform"]>),
                                            )
                                        }
                                        options={[
                                            { value: "inherit", label: "Inherit" },
                                            { value: "none", label: "None" },
                                            { value: "uppercase", label: "Uppercase" },
                                            { value: "lowercase", label: "Lowercase" },
                                            { value: "capitalize", label: "Capitalize" },
                                        ]}
                                        value={selectedElementSize?.textTransform ?? "inherit"}
                                    />
                                </FieldGrid>
                                <RangeField
                                    label="Text size"
                                    max={240}
                                    min={8}
                                    onChange={(value) => updateSelectedElementSize("fontSize", value)}
                                    unit="px"
                                    value={selectedFontSize}
                                />
                                <RangeField
                                    label="Line height"
                                    max={4}
                                    min={0.5}
                                    onChange={(value) => updateSelectedElementSize("lineHeight", value)}
                                    step={0.1}
                                    unit=""
                                    value={selectedElementSize?.lineHeight ?? selectedElement.lineHeight}
                                />
                                <RangeField
                                    label="Letter spacing"
                                    max={32}
                                    min={-8}
                                    onChange={(value) => updateSelectedElementSize("letterSpacing", value)}
                                    step={0.5}
                                    unit="px"
                                    value={selectedElementSize?.letterSpacing ?? selectedElement.letterSpacing}
                                />
                            </AccordionSection>
                        )}

                        {isImage && (
                            <AccordionSection defaultOpen title="Image">
                                <SelectField
                                    label="Image fit"
                                    onChange={(value) =>
                                        updateSelectedElementSize(
                                            "objectFit",
                                            value === "inherit"
                                                ? undefined
                                                : (value as NonNullable<DesignElementSize["objectFit"]>),
                                        )
                                    }
                                    options={[
                                        { value: "inherit", label: "Inherit" },
                                        { value: "cover", label: "Cover" },
                                        { value: "contain", label: "Contain" },
                                        { value: "fill", label: "Fill" },
                                        { value: "none", label: "None" },
                                        { value: "scale-down", label: "Scale down" },
                                    ]}
                                    value={selectedElementSize?.objectFit ?? "inherit"}
                                />
                            </AccordionSection>
                        )}

                        <AccordionSection defaultOpen={!allText} title="Appearance">
                            <FieldGrid>
                                {isText && (
                                    <ColorField
                                        compact
                                        label="Text color"
                                        onChange={(value) => updateSelectedElementSize("color", value)}
                                        value={selectedColor ?? tokens.text}
                                    />
                                )}
                                <ColorField
                                    compact
                                    label="Background"
                                    onChange={(value) =>
                                        updateSelectedElementSize("backgroundColor", value)
                                    }
                                    value={selectedBackgroundColor ?? tokens.background}
                                />
                                <ColorField
                                    compact
                                    label="Border color"
                                    onChange={(value) =>
                                        updateSelectedElementSize("borderColor", value)
                                    }
                                    value={selectedBorderColor ?? tokens.borderColor}
                                />
                                <SelectField
                                    label="Border style"
                                    onChange={(value) =>
                                        updateSelectedElementSize(
                                            "borderStyle",
                                            value === "inherit"
                                                ? undefined
                                                : (value as NonNullable<DesignElementSize["borderStyle"]>),
                                        )
                                    }
                                    options={[
                                        { value: "inherit", label: "Inherit" },
                                        { value: "none", label: "None" },
                                        { value: "solid", label: "Solid" },
                                        { value: "double", label: "Double" },
                                        { value: "dashed", label: "Dashed" },
                                    ]}
                                    value={selectedElementSize?.borderStyle ?? "inherit"}
                                />
                            </FieldGrid>
                            <FieldGrid>
                                <RangeField
                                    label="Padding"
                                    max={240}
                                    min={0}
                                    onChange={(value) => updateSelectedElementSize("padding", value)}
                                    unit="px"
                                    value={selectedElementSize?.padding ?? selectedElement.padding}
                                />
                                <RangeField
                                    label="Corner radius"
                                    max={240}
                                    min={0}
                                    onChange={(value) =>
                                        updateSelectedElementSize("borderRadius", value)
                                    }
                                    unit="px"
                                    value={
                                        selectedElementSize?.borderRadius ??
                                        selectedElement.borderRadius
                                    }
                                />
                            </FieldGrid>
                            <FieldGrid>
                                <RangeField
                                    label="Border width"
                                    max={24}
                                    min={0}
                                    onChange={(value) =>
                                        updateSelectedElementSize("borderWidth", value)
                                    }
                                    unit="px"
                                    value={selectedElementSize?.borderWidth ?? selectedElement.borderWidth}
                                />
                                <RangeField
                                    label="Opacity"
                                    max={1}
                                    min={0}
                                    onChange={(value) => updateSelectedElementSize("opacity", value)}
                                    step={0.05}
                                    unit=""
                                    value={selectedElementSize?.opacity ?? selectedElement.opacity}
                                />
                            </FieldGrid>
                        </AccordionSection>

                        <AccordionSection description="Relative to the container or selection" title="Align & distribute">
                            <div className="studio-align-grid">
                                <StudioButton onClick={() => alignSelection("horizontal", "start")} size="sm" variant="quiet">
                                    Align left
                                </StudioButton>
                                <StudioButton onClick={() => alignSelection("horizontal", "center")} size="sm" variant="quiet">
                                    Center horizontally
                                </StudioButton>
                                <StudioButton onClick={() => alignSelection("horizontal", "end")} size="sm" variant="quiet">
                                    Align right
                                </StudioButton>
                                <StudioButton onClick={() => alignSelection("vertical", "start")} size="sm" variant="quiet">
                                    Align top
                                </StudioButton>
                                <StudioButton onClick={() => alignSelection("vertical", "center")} size="sm" variant="quiet">
                                    Center vertically
                                </StudioButton>
                                <StudioButton onClick={() => alignSelection("vertical", "end")} size="sm" variant="quiet">
                                    Align bottom
                                </StudioButton>
                                <StudioButton onClick={() => centerSelectionInPage("horizontal")} size="sm" variant="quiet">
                                    Center in page
                                </StudioButton>
                                <StudioButton onClick={() => centerSelectionInPage("vertical")} size="sm" variant="quiet">
                                    Center page vertically
                                </StudioButton>
                                <StudioButton
                                    disabled={selectionCount < 3}
                                    onClick={() => distributeSelection("horizontal")}
                                    size="sm"
                                    variant="quiet"
                                >
                                    Distribute horizontally
                                </StudioButton>
                                <StudioButton
                                    disabled={selectionCount < 3}
                                    onClick={() => distributeSelection("vertical")}
                                    size="sm"
                                    variant="quiet"
                                >
                                    Distribute vertically
                                </StudioButton>
                            </div>
                            <p className="studio-hint">
                                Selection alignment uses the page as the frame. Ctrl-click or Cmd-click
                                to add more elements.
                            </p>
                        </AccordionSection>

                        {selectedElements.length > 1 && (
                            <Callout tone="info">
                                Size, position, and styling changes apply to all {selectedElements.length}{" "}
                                selected elements on the {activeBreakpoint} breakpoint.
                            </Callout>
                        )}
                    </div>
                )}
            </div>

            <footer className="studio-inspector__footer">
                <span className={cx("studio-inspector__status-dot", selectingElements && "is-live")} />
                {selectingElements ? "Selection mode on" : "Selection mode off"}
                <button className="studio-link studio-link--small" onClick={onOpenTools} type="button">
                    History & removed
                </button>
            </footer>
        </aside>
    );
});
