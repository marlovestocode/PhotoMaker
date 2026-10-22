"use client";

import { CustomDropdown } from "@/components/ui/custom-dropdown";
import { DesignPreviewFrame } from "../design-preview-frame";
import type {
    DesignElementSizes,
    DesignPreviewSelection,
    DesignTokens,
    GalleryContent,
    ResponsiveElementSizes,
} from "@/theme/design-system";
import { Badge, IconButton, SegmentedControl, StudioButton, cx } from "./controls";
import { PREVIEW_HEIGHT, VIEWPORT_OPTIONS, pageLabel } from "./constants";
import { StudioIcon } from "./icons";
import type { ElementBreakpoint } from "./types";

export function PreviewStage({
    previewPage,
    previewPath,
    allPagePaths,
    previewWidth,
    previewDraft,
    previewReloadKey,
    selectingElements,
    selectedElements,
    activeBreakpoint,
    tokens,
    elementSizes,
    responsiveElementSizes,
    hiddenElements,
    galleryContent,
    changePreviewPage,
    changePreviewWidth,
    changePreviewDraft,
    refreshPreview,
    toggleSelecting,
    onElementsSelected,
    onOpenInspector,
    isDirty,
}: {
    previewPage: string;
    previewPath: string;
    allPagePaths: string[];
    previewWidth: number;
    previewDraft: boolean;
    previewReloadKey: number;
    selectingElements: boolean;
    selectedElements: DesignPreviewSelection[];
    activeBreakpoint: ElementBreakpoint;
    tokens: DesignTokens;
    elementSizes: DesignElementSizes;
    responsiveElementSizes: ResponsiveElementSizes;
    hiddenElements: string[];
    galleryContent: GalleryContent;
    changePreviewPage: (path: string) => void;
    changePreviewWidth: (width: number) => void;
    changePreviewDraft: (draft: boolean) => void;
    refreshPreview: () => void;
    toggleSelecting: () => void;
    onElementsSelected: (selections: DesignPreviewSelection[], positionsChanged: boolean) => void;
    onOpenInspector: () => void;
    isDirty: boolean;
}) {
    const viewport = VIEWPORT_OPTIONS.find((option) => option.value === previewWidth);

    return (
        <section aria-label="Live page preview" className="studio-stage">
            <div className="studio-stage__toolbar">
                <div className="studio-stage__route">
                    <span className="studio-stage__route-label">Previewing</span>
                    <div className="studio-stage__route-select">
                        <CustomDropdown
                            ariaLabel={`Page to preview: ${pageLabel(previewPage)}`}
                            buttonClassName="studio-select__control studio-dropdown__trigger studio-stage__route-button"
                            menuClassName="studio-dropdown__menu"
                            menuLabel="Page to preview"
                            onChange={changePreviewPage}
                            optionClassName="studio-dropdown__option"
                            options={allPagePaths.map((path) => ({ label: pageLabel(path), value: path }))}
                            portal
                            selectedOptionClassName="is-selected"
                            value={previewPage}
                        />
                    </div>
                    <code className="studio-stage__path">{previewPath}</code>
                </div>

                <div className="studio-stage__controls">
                    <SegmentedControl
                        compact
                        label="Preview viewport"
                        onChange={(value) => changePreviewWidth(Number(value))}
                        options={VIEWPORT_OPTIONS.map((option) => ({
                            value: String(option.value),
                            label: `${option.shortLabel} (${option.value}px)`,
                            icon: option.icon,
                        }))}
                        value={String(previewWidth)}
                    />
                    <span aria-hidden="true" className="studio-stage__control-rule" />
                    <SegmentedControl
                        label="Preview version"
                        onChange={(value) => changePreviewDraft(value === "draft")}
                        options={[
                            { value: "draft", label: "Draft" },
                            { value: "saved", label: "Published" },
                        ]}
                        value={previewDraft ? "draft" : "saved"}
                    />
                    <IconButton
                        icon="refresh"
                        label="Refresh the live preview"
                        onClick={refreshPreview}
                    />
                    <a
                        aria-label={`Open ${previewPath} in a new tab`}
                        className="studio-icon-button"
                        href={previewPath}
                        rel="noreferrer"
                        target="_blank"
                        title="Open the page in a new tab"
                    >
                        <StudioIcon name="external-link" size={16} />
                    </a>
                </div>
            </div>

            <div className="studio-stage__subbar">
                <div className="studio-stage__context">
                    <Badge tone={previewDraft ? "accent" : "success"} dot>
                        {previewDraft ? (isDirty ? "Draft with changes" : "Draft") : "Published version"}
                    </Badge>
                    <span className="studio-stage__breakpoint">
                        {viewport?.shortLabel ?? "Custom"} · {previewWidth}px · {activeBreakpoint}
                    </span>
                </div>
                <div className="studio-stage__select">
                    <span className="studio-stage__select-hint">
                        {selectingElements
                            ? "Click an element, or Ctrl-click several. Drag to move."
                            : previewDraft
                              ? "Select an element to fine-tune it."
                              : "Switch to Draft to edit elements."}
                    </span>
                    <StudioButton
                        aria-pressed={selectingElements}
                        disabled={!previewDraft}
                        icon="cursor"
                        onClick={toggleSelecting}
                        size="sm"
                        variant={selectingElements ? "primary" : "secondary"}
                    >
                        {selectingElements ? "Stop selecting" : "Select elements"}
                    </StudioButton>
                </div>
            </div>

            <div className={cx("studio-stage__scroll", selectingElements && "is-selecting")}>
                <div className="studio-stage__frame">
                    <div aria-hidden="true" className="studio-stage__frame-bar">
                        <span className="studio-stage__frame-lights">
                            <i />
                            <i />
                            <i />
                        </span>
                        <span className="studio-stage__frame-address">{previewPath}</span>
                        <span className="studio-stage__frame-live">
                            <i /> Live preview
                        </span>
                    </div>
                    <DesignPreviewFrame
                        elementSizes={elementSizes}
                        galleryContent={galleryContent}
                        hiddenElements={hiddenElements}
                        key={previewPage}
                        onElementsSelected={onElementsSelected}
                        path={previewPath}
                        previewHeight={PREVIEW_HEIGHT}
                        reloadKey={previewReloadKey}
                        responsiveElementSizes={responsiveElementSizes}
                        selecting={selectingElements}
                        tokens={tokens}
                        viewportWidth={previewWidth}
                    />
                </div>

                {selectedElements.length > 0 && (
                    <div className="studio-stage__selection">
                        <span>
                            {selectedElements.length === 1
                                ? `Selected ${selectedElements[0].tag}`
                                : `${selectedElements.length} elements selected`}
                        </span>
                        <StudioButton icon="sliders" onClick={onOpenInspector} size="sm" variant="primary">
                            Edit element
                        </StudioButton>
                    </div>
                )}
            </div>
        </section>
    );
}
