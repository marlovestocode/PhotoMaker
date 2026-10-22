"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { SiteDesign } from "@/theme/design-system";
import { StudioButton } from "./design-studio/controls";
import { CommandPalette, type CommandAction } from "./design-studio/command-palette";
import { STUDIO_SECTIONS, isSectionAvailable, pageLabel } from "./design-studio/constants";
import { ElementInspector } from "./design-studio/element-inspector";
import { StudioIcon } from "./design-studio/icons";
import { ColorsPanel } from "./design-studio/panels/colors-panel";
import { GalleryPanel } from "./design-studio/panels/gallery-panel";
import { LayoutPanel } from "./design-studio/panels/layout-panel";
import { PresetsPanel } from "./design-studio/panels/presets-panel";
import { RoutesPanel } from "./design-studio/panels/routes-panel";
import { ToolsPanel } from "./design-studio/panels/tools-panel";
import { TypographyPanel } from "./design-studio/panels/typography-panel";
import { UploadPanel } from "./design-studio/panels/upload-panel";
import { PreviewStage } from "./design-studio/preview-stage";
import { SettingsRail } from "./design-studio/settings-rail";
import { StudioDialog, StudioSheet } from "./design-studio/sheet";
import { StudioTopbar } from "./design-studio/studio-topbar";
import { StudioToast } from "./design-studio/toast";
import type { SavedPreset, StudioSectionId } from "./design-studio/types";
import { useDesignDocument } from "./design-studio/use-design-document";

const DESKTOP_QUERY = "(min-width: 1280px)";
const MOBILE_QUERY = "(max-width: 899px)";

export function DesignStudio({
    initialDesign,
    customPresets,
}: {
    initialDesign: SiteDesign;
    customPresets: SavedPreset[];
}) {
    const studio = useDesignDocument({ initialDesign, initialPresets: customPresets });
    const {
        design,
        customPresets: presets,
        tokens,
        galleryContent,
        selectedPage,
        previewPage,
        previewPath,
        previewWidth,
        previewReloadKey,
        previewDraft,
        previewTokens,
        previewElementSizes,
        previewResponsiveElementSizes,
        previewHiddenElements,
        previewGalleryContent,
        activeBreakpoint,
        selectedElements,
        selectedElement,
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
        selectingElements,
        activePresetId,
        pendingAction,
        saveError,
        notice,
        isGlobal,
        isGalleryProfile,
        isUploadProfile,
        isDirty,
        hasPageProfile,
        scopeOverrideCount,
        allPagePaths,
        canUndo,
        canRedo,
        removedElements,
        contrastWarnings,
        changePreviewDraft,
        changeScope,
        changePreviewPage,
        changePreviewWidth,
        refreshPreview,
        toggleSelecting,
        undoDesign,
        redoDesign,
        saveDesign,
        savePreset,
        deletePreset,
        selectPreset,
        addPageProfile,
        resetPageProfile,
        resetCurrentScope,
        restoreSavedDesign,
        resetEverything,
        resetTokenSection,
        resetGalleryContent,
        updateToken,
        updateGalleryContent,
        copyCurrentDesign,
        pasteCurrentDesign,
        handleElementsSelected,
        alignSelection,
        centerSelectionInPage,
        distributeSelection,
        resetSelectedPositions,
        updateSelectedElementSize,
        resetSelectedElementSize,
        deleteSelectedElement,
        restoreElement,
        dismissNotice,
    } = studio;

    const [activeSection, setActiveSection] = useState<StudioSectionId | null>(null);
    const [railOpen, setRailOpen] = useState(false);
    const [inspectorOpen, setInspectorOpen] = useState(false);
    const [paletteOpen, setPaletteOpen] = useState(false);
    const [resetOpen, setResetOpen] = useState(false);

    const pending = pendingAction !== null;
    const scopeState = useMemo(
        () => ({ isGalleryProfile, isUploadProfile }),
        [isGalleryProfile, isUploadProfile],
    );
    const visibleSection =
        activeSection && isSectionAvailable(activeSection, scopeState) ? activeSection : null;
    const scopeName = isGlobal ? "Entire site" : pageLabel(selectedPage);
    const scopeLabel = isGlobal ? "the entire site" : pageLabel(selectedPage);

    const openSection = useCallback((section: StudioSectionId) => {
        setActiveSection(section);
        setPaletteOpen(false);

        if (typeof window !== "undefined" && window.matchMedia(MOBILE_QUERY).matches) {
            setInspectorOpen(false);
            setRailOpen(true);
        }
    }, []);

    const openSettingsSheet = useCallback(() => {
        setInspectorOpen(false);
        setRailOpen(true);
    }, []);

    const openInspectorSheet = useCallback(() => {
        setRailOpen(false);
        setInspectorOpen(true);
    }, []);

    const openPalette = useCallback(() => {
        setRailOpen(false);
        setInspectorOpen(false);
        setPaletteOpen(true);
    }, []);

    const openTools = useCallback(() => {
        setInspectorOpen(false);
        openSection("tools");
    }, [openSection]);

    useEffect(() => {
        const desktop = window.matchMedia(DESKTOP_QUERY);
        const tablet = window.matchMedia("(min-width: 900px)");

        function closeRailSheet(event: MediaQueryListEvent) {
            if (event.matches) setRailOpen(false);
        }
        function closeBothSheets(event: MediaQueryListEvent) {
            if (event.matches) {
                setRailOpen(false);
                setInspectorOpen(false);
            }
        }

        tablet.addEventListener("change", closeRailSheet);
        desktop.addEventListener("change", closeBothSheets);
        return () => {
            tablet.removeEventListener("change", closeRailSheet);
            desktop.removeEventListener("change", closeBothSheets);
        };
    }, []);

    useEffect(() => {
        function handlePaletteShortcut(event: KeyboardEvent) {
            if (
                !(event.ctrlKey || event.metaKey) ||
                event.altKey ||
                event.key.toLowerCase() !== "k" ||
                resetOpen
            ) {
                return;
            }

            event.preventDefault();
            setRailOpen(false);
            setInspectorOpen(false);
            setPaletteOpen((current) => !current);
        }

        window.addEventListener("keydown", handlePaletteShortcut);
        return () => window.removeEventListener("keydown", handlePaletteShortcut);
    }, [resetOpen]);

    const commands = useMemo<CommandAction[]>(() => {
        const sectionCommands: CommandAction[] = STUDIO_SECTIONS.filter((section) =>
            isSectionAvailable(section.id, scopeState),
        ).map((section) => ({
            id: `section-${section.id}`,
            label: section.label,
            group: "Settings",
            icon: section.icon,
            hint: section.description,
            keywords: section.keywords,
            run: () => openSection(section.id),
        }));

        const actionCommands: CommandAction[] = [
            {
                id: "publish",
                label: isDirty ? "Publish changes" : "Everything is published",
                group: "Actions",
                icon: "save",
                hint: isDirty ? `Save ${scopeName} and apply it to the live site` : scopeName,
                keywords: "save apply publish",
                disabled: !isDirty || pending,
                run: () => void saveDesign(),
            },
            {
                id: "undo",
                label: "Undo last change",
                group: "Actions",
                icon: "undo",
                shortcut: "Ctrl Z",
                keywords: "history back",
                disabled: !canUndo || pending,
                run: undoDesign,
            },
            {
                id: "redo",
                label: "Redo change",
                group: "Actions",
                icon: "redo",
                shortcut: "Ctrl Y",
                keywords: "history forward",
                disabled: !canRedo || pending,
                run: redoDesign,
            },
            {
                id: "revert",
                label: "Revert unpublished changes",
                group: "Actions",
                icon: "rotate",
                hint: "Return to the last published design",
                keywords: "restore discard",
                disabled: !isDirty || pending,
                run: restoreSavedDesign,
            },
            {
                id: "refresh-preview",
                label: "Refresh the live preview",
                group: "Actions",
                icon: "refresh",
                keywords: "reload iframe",
                run: refreshPreview,
            },
        ];

        const previewCommands: CommandAction[] = [
            {
                id: "select-elements",
                label: selectingElements ? "Stop selecting elements" : "Select elements in the preview",
                group: "Preview",
                icon: "cursor",
                hint: previewDraft
                    ? "Click elements in the canvas to style them"
                    : "Switch to the draft preview first",
                keywords: "inspect edit canvas",
                disabled: !previewDraft,
                run: toggleSelecting,
            },
            {
                id: "preview-draft",
                label: "Preview draft changes",
                group: "Preview",
                icon: "sliders",
                hint: previewDraft ? "Currently showing" : "See unpublished edits",
                keywords: "unsaved working",
                disabled: previewDraft,
                run: () => changePreviewDraft(true),
            },
            {
                id: "preview-published",
                label: "Preview published version",
                group: "Preview",
                icon: "check",
                hint: previewDraft ? "See what visitors see" : "Currently showing",
                keywords: "saved live site",
                disabled: !previewDraft,
                run: () => changePreviewDraft(false),
            },
            ...allPagePaths.map<CommandAction>((path) => ({
                id: `page-${path}`,
                label: pageLabel(path),
                group: "Preview page",
                icon: "image",
                hint: path,
                keywords: `page route ${path}`,
                disabled: previewPage === path,
                run: () => changePreviewPage(path),
            })),
            ...[
                { width: 1280, label: "Desktop viewport", icon: "monitor" as const },
                { width: 768, label: "Tablet viewport", icon: "tablet" as const },
                { width: 390, label: "Mobile viewport", icon: "smartphone" as const },
            ].map<CommandAction>((viewport) => ({
                id: `viewport-${viewport.width}`,
                label: viewport.label,
                group: "Preview viewport",
                icon: viewport.icon,
                hint: `${viewport.width}px wide`,
                keywords: "responsive breakpoint size",
                disabled: previewWidth === viewport.width,
                run: () => changePreviewWidth(viewport.width),
            })),
        ];

        const resetCommands: CommandAction[] = [
            {
                id: "reset-defaults",
                label: "Reset the entire design",
                group: "Danger zone",
                icon: "warning",
                hint: "Return every page to the original defaults",
                keywords: "clear defaults start over",
                disabled: pending,
                run: () => setResetOpen(true),
            },
        ];

        return [...sectionCommands, ...actionCommands, ...previewCommands, ...resetCommands];
    }, [
        allPagePaths,
        canRedo,
        canUndo,
        changePreviewDraft,
        changePreviewPage,
        changePreviewWidth,
        isDirty,
        openSection,
        pending,
        previewDraft,
        previewPage,
        previewWidth,
        refreshPreview,
        redoDesign,
        restoreSavedDesign,
        saveDesign,
        scopeName,
        scopeState,
        selectingElements,
        toggleSelecting,
        undoDesign,
    ]);

    function renderPanel() {
        switch (visibleSection) {
            case "colors":
                return (
                    <ColorsPanel
                        contrastWarnings={contrastWarnings}
                        resetTokenSection={resetTokenSection}
                        tokens={tokens}
                        updateToken={updateToken}
                    />
                );
            case "typography":
                return (
                    <TypographyPanel
                        resetTokenSection={resetTokenSection}
                        tokens={tokens}
                        updateToken={updateToken}
                    />
                );
            case "layout":
                return (
                    <LayoutPanel
                        resetTokenSection={resetTokenSection}
                        tokens={tokens}
                        updateToken={updateToken}
                    />
                );
            case "gallery":
                return (
                    <GalleryPanel
                        galleryContent={galleryContent}
                        resetGalleryContent={resetGalleryContent}
                        tokens={tokens}
                        updateGalleryContent={updateGalleryContent}
                    />
                );
            case "upload":
                return (
                    <UploadPanel
                        resetTokenSection={resetTokenSection}
                        tokens={tokens}
                        updateToken={updateToken}
                    />
                );
            case "presets":
                return (
                    <PresetsPanel
                        activePresetId={activePresetId}
                        customPresets={presets}
                        deletePreset={deletePreset}
                        pending={pending}
                        savePreset={savePreset}
                        scopeLabel={scopeLabel}
                        selectPreset={selectPreset}
                    />
                );
            case "routes":
                return (
                    <RoutesPanel
                        addPageProfile={addPageProfile}
                        allPagePaths={allPagePaths}
                        changeScope={changeScope}
                        design={design}
                        hasPageProfile={hasPageProfile}
                        resetPageProfile={resetPageProfile}
                        scopeOverrideCount={scopeOverrideCount}
                        selectedPage={selectedPage}
                    />
                );
            case "tools":
                return (
                    <ToolsPanel
                        canRedo={canRedo}
                        canUndo={canUndo}
                        copyCurrentDesign={copyCurrentDesign}
                        isDirty={isDirty}
                        onRequestResetDefaults={() => setResetOpen(true)}
                        pasteCurrentDesign={pasteCurrentDesign}
                        pending={pending}
                        previewPage={previewPage}
                        redoDesign={redoDesign}
                        removedElements={removedElements}
                        resetCurrentScope={resetCurrentScope}
                        restoreElement={restoreElement}
                        restoreSavedDesign={restoreSavedDesign}
                        scopeLabel={scopeLabel}
                        undoDesign={undoDesign}
                    />
                );
            default:
                return null;
        }
    }

    function renderInspector(onClose?: () => void) {
        return (
            <ElementInspector
                activeBreakpoint={activeBreakpoint}
                alignSelection={alignSelection}
                centerSelectionInPage={centerSelectionInPage}
                deleteSelectedElement={deleteSelectedElement}
                distributeSelection={distributeSelection}
                hasSelectedElementOverrides={hasSelectedElementOverrides}
                onClose={onClose}
                onOpenTools={openTools}
                previewDraft={previewDraft}
                previewPage={previewPage}
                removedElements={removedElements}
                resetSelectedElementSize={resetSelectedElementSize}
                resetSelectedPositions={resetSelectedPositions}
                selectedBackgroundColor={selectedBackgroundColor ?? undefined}
                selectedBorderColor={selectedBorderColor ?? undefined}
                selectedColor={selectedColor}
                selectedElement={selectedElement}
                selectedElementSize={selectedElementSize}
                selectedElements={selectedElements}
                selectedFontSize={selectedFontSize}
                selectedHeight={selectedHeight}
                selectedWidth={selectedWidth}
                selectedX={selectedX}
                selectedY={selectedY}
                selectingElements={selectingElements}
                toggleSelecting={toggleSelecting}
                tokens={tokens}
                updateSelectedElementSize={updateSelectedElementSize}
            />
        );
    }

    const rail = (idPrefix: string) => (
        <SettingsRail
            activeSection={visibleSection}
            allPagePaths={allPagePaths}
            changeScope={changeScope}
            hasPageProfile={hasPageProfile}
            idPrefix={idPrefix}
            isDirty={isDirty}
            isGalleryProfile={isGalleryProfile}
            isGlobal={isGlobal}
            isUploadProfile={isUploadProfile}
            onBack={() => setActiveSection(null)}
            onSelectSection={setActiveSection}
            panel={renderPanel()}
            scopeOverrideCount={scopeOverrideCount}
            selectedPage={selectedPage}
        />
    );

    return (
        <main
            aria-busy={pending}
            className="design-studio-page studio-shell"
            data-section={visibleSection ?? "overview"}
        >
            <a className="studio-skip-link" href="#studio-preview">
                Skip to live preview
            </a>
            <h1 className="studio-sr-only">Design studio</h1>

            <StudioTopbar
                canRedo={canRedo}
                canUndo={canUndo}
                isDirty={isDirty}
                onOpenInspector={openInspectorSheet}
                onOpenPalette={openPalette}
                onOpenSettings={openSettingsSheet}
                onRedo={redoDesign}
                onSave={() => void saveDesign()}
                onUndo={undoDesign}
                pending={pending}
                scopeLabel={scopeName}
                selectionCount={selectedElements.length}
            />

            {saveError && (
                <div className="studio-alertbar" role="alert">
                    <StudioIcon name="warning" size={17} />
                    <p>
                        <strong>Your changes could not be published.</strong> {saveError}
                    </p>
                    <StudioButton
                        disabled={pending}
                        onClick={() => void saveDesign()}
                        size="sm"
                        variant="secondary"
                    >
                        Try again
                    </StudioButton>
                </div>
            )}

            <div className="studio-workbench">
                <div className="studio-workbench__rail">{rail("desktop")}</div>
                <div className="studio-workbench__stage" id="studio-preview" tabIndex={-1}>
                    <PreviewStage
                        activeBreakpoint={activeBreakpoint}
                        allPagePaths={allPagePaths}
                        changePreviewDraft={changePreviewDraft}
                        changePreviewPage={changePreviewPage}
                        changePreviewWidth={changePreviewWidth}
                        elementSizes={previewElementSizes}
                        galleryContent={previewGalleryContent}
                        hiddenElements={previewHiddenElements}
                        isDirty={isDirty}
                        onElementsSelected={handleElementsSelected}
                        onOpenInspector={openInspectorSheet}
                        previewDraft={previewDraft}
                        previewPage={previewPage}
                        previewPath={previewPath}
                        previewReloadKey={previewReloadKey}
                        previewWidth={previewWidth}
                        refreshPreview={refreshPreview}
                        responsiveElementSizes={previewResponsiveElementSizes}
                        selectedElements={selectedElements}
                        selectingElements={selectingElements}
                        toggleSelecting={toggleSelecting}
                        tokens={previewTokens}
                    />
                </div>
                <div className="studio-workbench__inspector">{renderInspector()}</div>
            </div>

            <StudioSheet
                bodyClassName="studio-sheet__body--flush"
                className="studio-sheet--settings"
                description={`Adjust the look of ${isGlobal ? "every page" : scopeName}. Changes stay unpublished until you publish them.`}
                eyebrow="Design studio"
                onClose={() => setRailOpen(false)}
                open={railOpen}
                title="Settings"
            >
                {rail("sheet")}
            </StudioSheet>

            <StudioSheet
                bodyClassName="studio-sheet__body--flush"
                className="studio-sheet--inspector"
                hideHeader
                onClose={() => setInspectorOpen(false)}
                open={inspectorOpen}
                title="Element inspector"
            >
                {renderInspector(() => setInspectorOpen(false))}
            </StudioSheet>

            {paletteOpen && (
                <CommandPalette actions={commands} onClose={() => setPaletteOpen(false)} open />
            )}

            <StudioDialog
                className="studio-confirm"
                label="Reset the entire design"
                onClose={() => setResetOpen(false)}
                open={resetOpen}
            >
                <span aria-hidden="true" className="studio-confirm__icon">
                    <StudioIcon name="warning" size={22} />
                </span>
                <h2>Reset the entire design?</h2>
                <p>
                    Every page profile, element override, and token will return to the original
                    defaults. Nothing changes on the live site until you publish.
                </p>
                <div className="studio-confirm__actions">
                    <StudioButton onClick={() => setResetOpen(false)} variant="ghost">
                        Cancel
                    </StudioButton>
                    <StudioButton
                        icon="restore"
                        onClick={() => {
                            resetEverything();
                            setResetOpen(false);
                        }}
                        variant="danger"
                    >
                        Reset defaults
                    </StudioButton>
                </div>
            </StudioDialog>

            <StudioToast notice={notice} onDismiss={dismissNotice} />
        </main>
    );
}
