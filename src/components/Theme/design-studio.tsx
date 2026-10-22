"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { z } from "zod";
import { DesignPreviewFrame } from "@/components/Theme/design-preview-frame";
import { CustomDropdown } from "@/components/ui/custom-dropdown";
import {
    builtInLayoutPresets,
    defaultGalleryContent,
    defaultDesignTokens,
    designBreakpoints,
    designTokensToCss,
    designTokensSchema,
    elementPositionBounds,
    galleryContentLimits,
    galleryContentSchema,
    pageKeySchema,
    relativeLuminance,
    type GalleryTextField,
    type DesignElementSize,
    resolvePageDesignOverrides,
    resolveDesignTokens,
    type DesignElementSizes,
    type DesignPreviewSelection,
    type GalleryContent,
    type DesignTokens,
    type ResponsiveElementSizes,
    type SiteDesign,
} from "@/theme/design-system";

type SavedPreset = { id: string; name: string; tokens: DesignTokens };

const savedPresetResponseSchema = z.object({
    preset: z.object({
        id: z.string(),
        name: z.string(),
        tokens: designTokensSchema,
    }),
});

const pageChoices = [
    { path: "/gallery", label: "Public gallery" },
    { path: "/", label: "Home (redirects to photo studio)" },
    { path: "/upload", label: "Photo studio" },
    { path: "/auth/sign-in", label: "Sign-in page" },
    { path: "/settings/design", label: "Design settings" },
    { path: "/dev/divider", label: "Divider demo" },
    { path: "/dev/heading", label: "Heading demo" },
    { path: "/dev/image", label: "Image demo" },
    { path: "/dev/theme", label: "Theme demo" },
];

const viewportOptions = [
    { value: 1280, label: "Desktop" },
    { value: 768, label: "Tablet" },
    { value: 390, label: "Mobile" },
];

const subscribeToEmbedding = () => () => {};
const getIsEmbeddedPreview = () => window.parent !== window;
const getServerEmbeddingSnapshot = () => false;

const fontOptions: Array<{ value: DesignTokens["headingFont"]; label: string }> = [
    { value: "serif", label: "Classic serif" },
    { value: "sans", label: "Clean sans serif" },
    { value: "display", label: "Decorative display" },
    { value: "monospace", label: "Monospace" },
];

function responseError(value: unknown, fallback: string): string {
    if (typeof value === "object" && value !== null && "error" in value && typeof value.error === "string") {
        return value.error;
    }

    return fallback;
}

type PageDesignOverrides = SiteDesign["pages"][string];
type ElementBreakpoint = "desktop" | "tablet" | "mobile";

function getElementSizesForBreakpoint(
    page: PageDesignOverrides,
    breakpoint: ElementBreakpoint,
) {
    return breakpoint === "desktop"
        ? page.elementSizes ?? {}
        : page.responsiveElementSizes?.[breakpoint] ?? {};
}

function updateElementSizesForBreakpoint(
    page: PageDesignOverrides,
    breakpoint: ElementBreakpoint,
    elementSizes: DesignElementSizes,
): PageDesignOverrides {
    if (breakpoint === "desktop") {
        return { ...page, elementSizes };
    }

    const responsiveElementSizes: ResponsiveElementSizes = {
        ...page.responsiveElementSizes,
        [breakpoint]: elementSizes,
    };
    if (Object.keys(elementSizes).length === 0) {
        delete responsiveElementSizes[breakpoint];
    }
    return { ...page, responsiveElementSizes };
}

function contrastRatio(foreground: string, background: string) {
    const first = relativeLuminance(foreground);
    const second = relativeLuminance(background);
    return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

const HISTORY_COALESCE_MS = 600;

function findPresetIdForTokens(tokens: DesignTokens, savedPresets: SavedPreset[]): string {
    const serialized = JSON.stringify(tokens);
    return (
        builtInLayoutPresets.find((preset) => JSON.stringify(preset.tokens) === serialized)?.id ??
        savedPresets.find((preset) => JSON.stringify(preset.tokens) === serialized)?.id ??
        ""
    );
}

export function DesignStudio({
    initialDesign,
    customPresets: initialPresets,
}: {
    initialDesign: SiteDesign;
    customPresets: SavedPreset[];
}) {
    const [design, setDesign] = useState(initialDesign);
    const [savedDesign, setSavedDesign] = useState(initialDesign);
    const [customPresets, setCustomPresets] = useState(initialPresets);
    const [selectedPage, setSelectedPage] = useState("/gallery");
    const [previewPage, setPreviewPage] = useState("/gallery");
    const [previewWidth, setPreviewWidth] = useState(1280);
    const [previewReloadKey, setPreviewReloadKey] = useState(0);
    const [selectingElements, setSelectingElements] = useState(false);
    const [selectedElements, setSelectedElements] = useState<DesignPreviewSelection[]>([]);
    const [settingsSearch, setSettingsSearch] = useState("");
    const [previewDraft, setPreviewDraft] = useState(true);
    const [newPagePath, setNewPagePath] = useState("");
    const [presetName, setPresetName] = useState("");
    const [activePresetId, setActivePresetId] = useState(() =>
        findPresetIdForTokens(initialDesign.global, initialPresets),
    );
    const [history, setHistory] = useState<{ past: SiteDesign[]; future: SiteDesign[] }>({ past: [], future: [] });
    const [pending, setPending] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const lastCommitAtRef = useRef(0);
    const isEmbeddedPreview = useSyncExternalStore(
        subscribeToEmbedding,
        getIsEmbeddedPreview,
        getServerEmbeddingSnapshot,
    );

    const isGlobal = selectedPage === "__global__";
    const isGalleryProfile = selectedPage === "/gallery";
    const isUploadProfile = selectedPage === "/upload";
    const tokens = isGlobal
        ? design.global
        : resolveDesignTokens(design, concretePreviewPath(selectedPage));
    const previewPath = concretePreviewPath(previewPage);
    const previewDesign = previewDraft ? design : savedDesign;
    const activeBreakpoint = previewWidth <= designBreakpoints.mobileMax
        ? "mobile"
        : previewWidth <= designBreakpoints.tabletMax
          ? "tablet"
          : "desktop";
    const previewTokens = resolveDesignTokens(previewDesign, previewPath);
    const previewPageOverrides = resolvePageDesignOverrides(previewDesign, previewPath);
    const galleryContent = {
        ...defaultGalleryContent,
        ...design.pages["/gallery"]?.galleryContent,
    };
    const previewGalleryContent: GalleryContent = {
        ...defaultGalleryContent,
        ...previewPageOverrides?.galleryContent,
    };
    const previewBaseElementSizes = previewPageOverrides?.elementSizes ?? {};
    const previewResponsiveElementSizes = previewPageOverrides?.responsiveElementSizes ?? {};
    const previewCurrentBreakpointSizes: DesignElementSizes = activeBreakpoint === "desktop"
        ? {}
        : previewResponsiveElementSizes[activeBreakpoint] ?? {};
    const previewElementSizes = Object.fromEntries(
        [...new Set([
            ...Object.keys(previewBaseElementSizes),
            ...Object.keys(previewCurrentBreakpointSizes),
        ])].map((locator) => [
            locator,
            { ...previewBaseElementSizes[locator], ...previewCurrentBreakpointSizes[locator] },
        ]),
    );
    const previewHiddenElements = previewPageOverrides?.hiddenElements ?? [];
    const selectedElement = selectedElements[0] ?? null;
    const selectedElementSize = selectedElement
        ? previewElementSizes[selectedElement.locator]
        : undefined;
    const selectedWidth = selectedElementSize?.width ?? Math.max(16, Math.min(2400, selectedElement?.width ?? 16));
    const selectedHeight = selectedElementSize?.height ?? Math.max(16, Math.min(2400, selectedElement?.height ?? 16));
    const selectedFontSize = selectedElementSize?.fontSize ?? Math.max(8, Math.min(240, selectedElement?.fontSize ?? 16));
    const selectedX = selectedElementSize?.x ?? selectedElement?.x ?? 0;
    const selectedY = selectedElementSize?.y ?? selectedElement?.y ?? 0;
    const selectedColor = selectedElementSize?.color ?? selectedElement?.color;
    const selectedBackgroundColor = selectedElementSize?.backgroundColor ?? selectedElement?.backgroundColor;
    const selectedBorderColor = selectedElementSize?.borderColor ?? selectedElement?.borderColor;
    const hasSelectedElementOverrides = selectedElements.some((element) =>
        (activeBreakpoint === "desktop" ? previewBaseElementSizes : previewCurrentBreakpointSizes)[element.locator],
    );
    const allPagePaths = [...new Set([...pageChoices.map((page) => page.path), ...Object.keys(design.pages)])];
    const isDirty = JSON.stringify(design) !== JSON.stringify(savedDesign);
    const canUndo = history.past.length > 0;
    const canRedo = history.future.length > 0;
    const settingsMatch = (terms: string) =>
        !settingsSearch.trim() ||
        settingsSearch.trim().toLocaleLowerCase().split(/\s+/).every((term) =>
            terms.toLocaleLowerCase().includes(term),
        );
    const contrastWarnings = [
        ["Main text", tokens.text, tokens.background],
        ["Secondary text", tokens.muted, tokens.background],
        ["Button text", tokens.buttonText, tokens.buttonBackground],
        ["Hover text", tokens.hoverText, tokens.hoverBackground],
    ].flatMap(([label, foreground, background]) => {
        const ratio = contrastRatio(foreground, background);
        return ratio < 4.5 ? [{ label, ratio }] : [];
    });

    useEffect(() => {
        if (!isDirty) {
            return;
        }

        function warnBeforeLeaving(event: BeforeUnloadEvent) {
            event.preventDefault();
            event.returnValue = "";
        }

        window.addEventListener("beforeunload", warnBeforeLeaving);
        return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
    }, [isDirty]);

    function commitDesign(next: SiteDesign) {
        if (JSON.stringify(next) === JSON.stringify(design)) {
            return;
        }

        // Continuous gestures (slider drags, typing) collapse into one undo step.
        const coalesce = Date.now() - lastCommitAtRef.current < HISTORY_COALESCE_MS;
        lastCommitAtRef.current = Date.now();

        setHistory((current) => ({
            past: coalesce && current.past.length > 0
                ? current.past
                : [...current.past, design].slice(-50),
            future: [],
        }));
        setDesign(next);
        setPreviewDraft(true);
        setMessage("");
        setError("");
    }

    function resetTokenSection(keys: Array<keyof DesignTokens>) {
        if (isGlobal) {
            commitDesign({
                ...design,
                global: {
                    ...design.global,
                    ...Object.fromEntries(keys.map((key) => [key, defaultDesignTokens[key]])),
                },
            });
        } else {
            const page = { ...design.pages[selectedPage] };
            for (const key of keys) delete page[key];
            commitDesign({
                ...design,
                pages: { ...design.pages, [selectedPage]: page },
            });
        }
        setActivePresetId("");
        setMessage("This design section now uses its inherited defaults.");
    }

    function resetGallerySection(keys: Array<keyof GalleryContent>) {
        const page = design.pages["/gallery"] ?? {};
        const galleryContent = { ...page.galleryContent };
        for (const key of keys) delete galleryContent[key];
        commitDesign({
            ...design,
            pages: { ...design.pages, "/gallery": { ...page, galleryContent } },
        });
        setMessage("These gallery settings now use their defaults.");
    }

    const undoDesign = useCallback(() => {
        const previous = history.past[history.past.length - 1];
        if (!previous) {
            return;
        }

        setDesign(previous);
        setHistory({ past: history.past.slice(0, -1), future: [design, ...history.future] });
    }, [design, history]);

    const redoDesign = useCallback(() => {
        const next = history.future[0];
        if (!next) {
            return;
        }

        setDesign(next);
        setHistory({ past: [...history.past, design].slice(-50), future: history.future.slice(1) });
    }, [design, history]);

    useEffect(() => {
        function handleShortcuts(event: KeyboardEvent) {
            if (!(event.ctrlKey || event.metaKey) || event.altKey) {
                return;
            }

            const target = event.target;
            const isTextEntry =
                target instanceof HTMLElement &&
                (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

            if (isTextEntry) {
                return;
            }

            if (event.key.toLowerCase() === "z") {
                event.preventDefault();
                if (event.shiftKey) {
                    redoDesign();
                } else {
                    undoDesign();
                }
            } else if (event.key.toLowerCase() === "y") {
                event.preventDefault();
                redoDesign();
            }
        }

        window.addEventListener("keydown", handleShortcuts);
        return () => window.removeEventListener("keydown", handleShortcuts);
    }, [redoDesign, undoDesign]);

    function restoreSavedDesign() {
        commitDesign(savedDesign);
        setHistory({ past: [], future: [] });
        setActivePresetId("");
        setMessage("Unsaved changes were reverted to the last saved design.");
    }

    function resetEverything() {
        if (!window.confirm("Reset the entire site design and all page overrides to the original defaults? This will not save until you choose Save and apply.")) {
            return;
        }

        commitDesign({ global: defaultDesignTokens, pages: {} });
        setSelectedPage("__global__");
        setActivePresetId("");
        setMessage("The design is reset to defaults. Save and apply when you are ready.");
    }

    function resetCurrentScope() {
        if (isGlobal) {
            commitDesign({ ...design, global: savedDesign.global });
            setActivePresetId("");
            setMessage("Site-wide settings restored to their last saved values.");
            return;
        }

        const pages = { ...design.pages };
        if (savedDesign.pages[selectedPage]) {
            pages[selectedPage] = savedDesign.pages[selectedPage];
        } else {
            delete pages[selectedPage];
        }

        commitDesign({ ...design, pages });
        setActivePresetId("");
        setMessage("This page was restored to its last saved settings.");
    }

    function changeScope(path: string) {
        setSelectedPage(path);
        if (path !== "__global__") {
            setPreviewPage(path);
            setSelectedElements([]);
        }
    }

    function changePreviewPage(path: string) {
        setPreviewPage(path);
        setSelectedElements([]);
        if (!isGlobal) {
            setSelectedPage(path);
        }
    }

    function handleElementsSelected(selections: DesignPreviewSelection[], positionsChanged: boolean) {
        setSelectedElements(selections);
        setSelectedPage(previewPage);
        if (!positionsChanged || selections.length === 0) {
            return;
        }

        const page = design.pages[previewPage] ?? {};
        const elementSizes = { ...getElementSizesForBreakpoint(page, activeBreakpoint) };
        let positionChanged = false;
        for (const selection of selections) {
            const current = previewElementSizes[selection.locator];
            if ((current?.x ?? 0) === selection.x && (current?.y ?? 0) === selection.y) {
                continue;
            }

            elementSizes[selection.locator] = {
                ...current,
                x: selection.x,
                y: selection.y,
            };
            positionChanged = true;
        }

        if (positionChanged) {
            commitDesign({
                ...design,
                pages: {
                    ...design.pages,
                    [previewPage]: updateElementSizesForBreakpoint(page, activeBreakpoint, elementSizes),
                },
            });
        }
    }

    function applyPositionDeltas(deltas: Array<{ locator: string; x: number; y: number }>) {
        if (deltas.length === 0) {
            return;
        }

        const page = design.pages[previewPage] ?? {};
        const elementSizes = { ...getElementSizesForBreakpoint(page, activeBreakpoint) };
        const deltaByLocator = new Map(deltas.map((delta) => [
            delta.locator,
            {
                x: Math.max(elementPositionBounds.min, Math.min(elementPositionBounds.max, delta.x)),
                y: Math.max(elementPositionBounds.min, Math.min(elementPositionBounds.max, delta.y)),
            },
        ]));

        for (const element of selectedElements) {
            const delta = deltaByLocator.get(element.locator);
            if (!delta) {
                continue;
            }

            elementSizes[element.locator] = {
                ...elementSizes[element.locator],
                x: delta.x,
                y: delta.y,
            };
        }

        commitDesign({
            ...design,
            pages: {
                ...design.pages,
                [previewPage]: updateElementSizesForBreakpoint(page, activeBreakpoint, elementSizes),
            },
        });
        setSelectedElements((current) =>
            current.map((element) => {
                const delta = deltaByLocator.get(element.locator);
                if (!delta) {
                    return element;
                }

                return {
                    ...element,
                    left: element.left + delta.x - element.x,
                    top: element.top + delta.y - element.y,
                    x: delta.x,
                    y: delta.y,
                };
            }),
        );
        setActivePresetId("");
    }

    function updateGalleryContent<Key extends keyof GalleryContent>(key: Key, value: GalleryContent[Key]) {
        const page = design.pages["/gallery"] ?? {};
        const galleryContent: Partial<GalleryContent> = { ...page.galleryContent };
        galleryContent[key] = value;
        commitDesign({
            ...design,
            pages: {
                ...design.pages,
                "/gallery": { ...page, galleryContent },
            },
        });
    }

    function alignSelection(axis: "horizontal" | "vertical", edge: "start" | "center" | "end") {
        if (selectedElements.length === 0) {
            return;
        }

        const isHorizontal = axis === "horizontal";
        const startKey = isHorizontal ? "left" : "top";
        const sizeKey = isHorizontal ? "width" : "height";
        const parentStartKey = isHorizontal ? "parentLeft" : "parentTop";
        const parentSizeKey = isHorizontal ? "parentWidth" : "parentHeight";
        const first = selectedElements[0];

        if (selectedElements.length === 1) {
            const elementStart = first[startKey];
            const elementSize = first[sizeKey];
            const parentStart = first[parentStartKey];
            const parentSize = first[parentSizeKey];
            const targetStart =
                edge === "start"
                    ? parentStart
                    : edge === "center"
                      ? parentStart + (parentSize - elementSize) / 2
                      : parentStart + parentSize - elementSize;
            const delta = Math.round(targetStart - elementStart);
            applyPositionDeltas([{
                locator: first.locator,
                x: first.x + (isHorizontal ? delta : 0),
                y: first.y + (isHorizontal ? 0 : delta),
            }]);
            return;
        }

        const starts = selectedElements.map((element) => element[startKey]);
        const ends = selectedElements.map((element) => element[startKey] + element[sizeKey]);
        const groupStart = Math.min(...starts);
        const groupEnd = Math.max(...ends);
        const target = edge === "start"
            ? groupStart
            : edge === "center"
              ? (groupStart + groupEnd) / 2
              : groupEnd;

        applyPositionDeltas(selectedElements.map((element) => {
            const elementStart = element[startKey];
            const elementSize = element[sizeKey];
            const targetStart = edge === "start"
                ? target
                : edge === "center"
                  ? target - elementSize / 2
                  : target - elementSize;
            const delta = Math.round(targetStart - elementStart);
            return {
                locator: element.locator,
                x: element.x + (isHorizontal ? delta : 0),
                y: element.y + (isHorizontal ? 0 : delta),
            };
        }));
    }

    function centerSelectionInPage(axis: "horizontal" | "vertical") {
        if (selectedElements.length === 0) {
            return;
        }

        const isHorizontal = axis === "horizontal";
        const startKey = isHorizontal ? "left" : "top";
        const sizeKey = isHorizontal ? "width" : "height";
        const first = selectedElements[0];
        const containerStart = selectedElements.length === 1
            ? (isHorizontal ? first.parentLeft : first.parentTop)
            : (isHorizontal ? first.pageLeft : first.pageTop);
        const containerSize = selectedElements.length === 1
            ? (isHorizontal ? first.parentWidth : first.parentHeight)
            : (isHorizontal ? first.pageWidth : first.pageHeight);
        const starts = selectedElements.map((element) => element[startKey]);
        const ends = selectedElements.map((element) => element[startKey] + element[sizeKey]);
        const groupStart = Math.min(...starts);
        const groupEnd = Math.max(...ends);
        const delta = Math.round(containerStart + (containerSize - (groupEnd - groupStart)) / 2 - groupStart);

        applyPositionDeltas(selectedElements.map((element) => ({
            locator: element.locator,
            x: element.x + (isHorizontal ? delta : 0),
            y: element.y + (isHorizontal ? 0 : delta),
        })));
    }

    function distributeSelection(axis: "horizontal" | "vertical") {
        if (selectedElements.length < 3) {
            return;
        }

        const isHorizontal = axis === "horizontal";
        const startKey = isHorizontal ? "left" : "top";
        const sizeKey = isHorizontal ? "width" : "height";
        const ordered = [...selectedElements].sort((left, right) => left[startKey] - right[startKey]);
        const first = ordered[0];
        const last = ordered[ordered.length - 1];
        const totalSize = ordered.reduce((total, element) => total + element[sizeKey], 0);
        const gap = (last[startKey] + last[sizeKey] - first[startKey] - totalSize) / (ordered.length - 1);
        let nextStart = first[startKey];

        applyPositionDeltas(ordered.map((element) => {
            const delta = Math.round(nextStart - element[startKey]);
            nextStart += element[sizeKey] + gap;
            return {
                locator: element.locator,
                x: element.x + (isHorizontal ? delta : 0),
                y: element.y + (isHorizontal ? 0 : delta),
            };
        }));
    }

    function resetSelectedPositions() {
        if (!selectedElements.some((element) => element.x !== 0 || element.y !== 0)) {
            return;
        }

        applyPositionDeltas(selectedElements.map((element) => ({
            locator: element.locator,
            x: 0,
            y: 0,
        })));
    }

    function updateSelectedElementSize<Key extends keyof DesignElementSize>(
        property: Key,
        value: DesignElementSize[Key] | undefined,
    ) {
        if (selectedElements.length === 0) {
            return;
        }

        const page = design.pages[previewPage] ?? {};
        const elementSizes = { ...getElementSizesForBreakpoint(page, activeBreakpoint) };
        for (const element of selectedElements) {
            const nextElementSize = { ...elementSizes[element.locator] };
            if (value === undefined) {
                delete nextElementSize[property];
            } else {
                nextElementSize[property] = value;
            }
            elementSizes[element.locator] = {
                ...nextElementSize,
            };
        }
        commitDesign({
            ...design,
            pages: {
                ...design.pages,
                [previewPage]: updateElementSizesForBreakpoint(page, activeBreakpoint, elementSizes),
            },
        });
        setSelectedElements((current) =>
            current.map((element) => {
                if (!selectedElements.some((selected) => selected.locator === element.locator) || value === undefined) {
                    return element;
                }
                if (property === "width" && typeof value === "number") return { ...element, width: value };
                if (property === "height" && typeof value === "number") return { ...element, height: value };
                if (property === "fontSize" && typeof value === "number") return { ...element, fontSize: value };
                if (property === "x" && typeof value === "number") {
                    const delta = value - element.x;
                    return { ...element, x: value, left: element.left + delta };
                }
                if (property === "y" && typeof value === "number") {
                    const delta = value - element.y;
                    return { ...element, y: value, top: element.top + delta };
                }
                return element;
            }),
        );
        setActivePresetId("");
    }

    function resetSelectedElementSize() {
        if (selectedElements.length === 0) {
            return;
        }

        const page = design.pages[previewPage];
        if (!page || Object.keys(getElementSizesForBreakpoint(page, activeBreakpoint)).length === 0) {
            return;
        }

        const elementSizes = { ...getElementSizesForBreakpoint(page, activeBreakpoint) };
        let changed = false;
        for (const element of selectedElements) {
            if (elementSizes[element.locator]) {
                delete elementSizes[element.locator];
                changed = true;
            }
        }
        if (!changed) {
            return;
        }
        commitDesign({
            ...design,
            pages: {
                ...design.pages,
                [previewPage]: updateElementSizesForBreakpoint(page, activeBreakpoint, elementSizes),
            },
        });
        setActivePresetId("");
        setMessage("Selected elements now use their original sizes and positions.");
    }

    function deleteSelectedElement() {
        if (selectedElements.length === 0) {
            return;
        }

        const page = design.pages[previewPage] ?? {};
        const selectedLocators = selectedElements.map((element) => element.locator);
        const hiddenElements = [...new Set([...(page.hiddenElements ?? []), ...selectedLocators])];
        const elementSizes = { ...page.elementSizes };
        for (const locator of selectedLocators) {
            delete elementSizes[locator];
        }
        const responsiveElementSizes: ResponsiveElementSizes = { ...page.responsiveElementSizes };
        for (const breakpoint of ["tablet", "mobile"] as const) {
            const breakpointSizes = { ...responsiveElementSizes[breakpoint] };
            for (const locator of selectedLocators) {
                delete breakpointSizes[locator];
            }
            if (Object.keys(breakpointSizes).length > 0) {
                responsiveElementSizes[breakpoint] = breakpointSizes;
            } else {
                delete responsiveElementSizes[breakpoint];
            }
        }
        commitDesign({
            ...design,
            pages: {
                ...design.pages,
                [previewPage]: { ...page, elementSizes, responsiveElementSizes, hiddenElements },
            },
        });
        setSelectedElements([]);
        setMessage(`${selectedLocators.length} selected element${selectedLocators.length === 1 ? "" : "s"} removed from this page. You can restore them below or undo this change.`);
    }

    function restoreElement(locator: string) {
        const page = design.pages[previewPage];
        if (!page?.hiddenElements?.includes(locator)) {
            return;
        }

        const hiddenElements = page.hiddenElements.filter((hiddenLocator) => hiddenLocator !== locator);
        commitDesign({
            ...design,
            pages: {
                ...design.pages,
                [previewPage]: { ...page, hiddenElements },
            },
        });
        setMessage("Element restored to this page.");
    }

    async function copyCurrentDesign() {
        try {
            await navigator.clipboard.writeText(JSON.stringify(tokens, null, 2));
            setMessage("Current design copied. Select another page and paste it there.");
            setError("");
        } catch (cause) {
            setError(cause instanceof Error ? `Could not access the clipboard: ${cause.message}` : "Could not access the clipboard.");
        }
    }

    async function pasteCurrentDesign() {
        try {
            const text = await navigator.clipboard.readText();
            const parsedJson: unknown = JSON.parse(text);
            const parsed = designTokensSchema.safeParse(parsedJson);

            if (!parsed.success) {
                setError("Clipboard content is not a valid Photo Maker design preset.");
                return;
            }

            const next = isGlobal
                ? { ...design, global: parsed.data }
                : {
                      ...design,
                      pages: {
                          ...design.pages,
                          [selectedPage]: { ...design.pages[selectedPage], ...parsed.data },
                      },
                  };
            commitDesign(next);
            setActivePresetId("");
            setMessage("Design settings pasted into the selected scope.");
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Could not read a valid design from the clipboard.");
        }
    }

    function updateToken<Key extends keyof DesignTokens>(key: Key, value: DesignTokens[Key]) {
        const next = isGlobal
            ? { ...design, global: { ...design.global, [key]: value } }
            : { ...design, pages: { ...design.pages, [selectedPage]: { ...design.pages[selectedPage], [key]: value } } };
        commitDesign(next);
        setActivePresetId("");
    }

    function selectPreset(id: string) {
        const preset =
            builtInLayoutPresets.find((candidate) => candidate.id === id) ??
            customPresets.find((candidate) => candidate.id === id);

        if (!preset) {
            return;
        }

        const next = isGlobal
            ? { ...design, global: preset.tokens }
            : {
                  ...design,
                  pages: {
                      ...design.pages,
                      [selectedPage]: { ...design.pages[selectedPage], ...preset.tokens },
                  },
              };
        commitDesign(next);
        setActivePresetId(id);
    }

    function addPageProfile() {
        const path = newPagePath.trim();

        if (!pageKeySchema.safeParse(path).success) {
            setError("Enter a route path that starts with / and does not include a query, hash, or traversal segments.");
            return;
        }

        const next = { ...design, pages: { ...design.pages, [path]: design.pages[path] ?? {} } };
        commitDesign(next);
        setSelectedPage(path);
        setPreviewPage(path);
        setNewPagePath("");
        setError("");
        setMessage("New page profile added. It inherits the site design until you change its settings.");
    }

    function resetPageProfile() {
        if (isGlobal) {
            return;
        }

        const pages = { ...design.pages };
        delete pages[selectedPage];
        commitDesign({ ...design, pages });
        setActivePresetId("");
        setError("");
        setMessage("This page now inherits every setting from the site design.");
    }

    async function saveDesign() {
        setPending(true);
        setError("");
        setMessage("");

        try {
            const response = await fetch("/api/design/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(design),
            });
            const result: unknown = await response.json();

            if (!response.ok) {
                setError(responseError(result, "The design settings could not be saved."));
                return;
            }

            setSavedDesign(design);
            setPreviewDraft(true);
            setHistory({ past: [], future: [] });
            setMessage("Design settings saved and applied to the site.");
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "The design settings could not be saved.");
        } finally {
            setPending(false);
        }
    }

    async function savePreset(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setPending(true);
        setError("");
        setMessage("");

        try {
            const response = await fetch("/api/design/presets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: presetName, tokens }),
            });
            const result: unknown = await response.json();

            if (!response.ok) {
                setError(responseError(result, "The preset could not be saved."));
                return;
            }

            const parsed = savedPresetResponseSchema.safeParse(result);

            if (!parsed.success) {
                throw new Error("The server returned an invalid design preset.");
            }

            setCustomPresets((current) => [...current, parsed.data.preset].sort((left, right) => left.name.localeCompare(right.name)));
            setActivePresetId(parsed.data.preset.id);
            setPresetName("");
            setMessage(`“${parsed.data.preset.name}” is now available in your saved presets.`);
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "The preset could not be saved.");
        } finally {
            setPending(false);
        }
    }

    async function deletePreset() {
        const selectedPreset = customPresets.find((preset) => preset.id === activePresetId);

        if (!selectedPreset) {
            return;
        }

        setPending(true);
        setError("");
        setMessage("");

        try {
            const response = await fetch(`/api/design/presets/${encodeURIComponent(selectedPreset.id)}`, {
                method: "DELETE",
            });
            const result: unknown = await response.json();

            if (!response.ok) {
                setError(responseError(result, "The preset could not be deleted."));
                return;
            }

            setCustomPresets((current) => current.filter((preset) => preset.id !== selectedPreset.id));
            setActivePresetId("");
            setMessage(`“${selectedPreset.name}” was deleted. Your current design was not changed.`);
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "The preset could not be deleted.");
        } finally {
            setPending(false);
        }
    }

    return (
        <main
            className="design-studio-page mx-auto w-full max-w-[1800px] px-4 py-5 sm:px-6 sm:py-7"
            style={isEmbeddedPreview ? undefined : designTokensToCss(defaultDesignTokens)}
        >
            <header className="design-studio-header flex flex-wrap items-end justify-between gap-5 border-b border-stone-300 pb-6">
                <div>
                    <a className="text-sm font-semibold text-[var(--site-accent)] underline" href="/upload">
                        Back to photo studio
                    </a>
                    <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--site-accent)]">
                        Photo Maker
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight">Design settings</h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--site-muted)]">
                        Set the look of the whole site, then customize individual routes only where you want a different
                        style. New pages inherit your site design automatically.
                    </p>
                </div>
                <button
                    className="site-primary-button min-h-12 rounded-xl px-5 font-semibold disabled:cursor-wait disabled:opacity-60"
                    disabled={pending}
                    onClick={saveDesign}
                    style={{
                        backgroundColor: defaultDesignTokens.buttonBackground,
                        color: defaultDesignTokens.buttonText,
                    }}
                    type="button"
                >
                    {pending ? "Saving..." : isDirty ? "Save and apply changes" : "All changes saved"}
                </button>
            </header>

            <div className="design-studio-toolbar mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-stone-300 bg-white/70 p-3">
                <span className={`design-status-badge mr-auto text-sm font-medium ${isDirty ? "text-amber-900" : "text-emerald-800"}`}>
                    {isDirty ? "Unsaved changes" : "Saved"}
                </span>
                <button
                    aria-label="Undo change"
                    className="min-h-10 rounded-lg border border-stone-300 px-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={!canUndo || pending}
                    onClick={undoDesign}
                    title="Undo (Ctrl+Z)"
                    type="button"
                >
                    Undo
                </button>
                <button
                    aria-label="Redo change"
                    className="min-h-10 rounded-lg border border-stone-300 px-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={!canRedo || pending}
                    onClick={redoDesign}
                    title="Redo (Ctrl+Y)"
                    type="button"
                >
                    Redo
                </button>
                <button
                    className="min-h-10 rounded-lg border border-stone-300 px-3 text-sm font-medium disabled:opacity-40"
                    disabled={!isDirty || pending}
                    onClick={restoreSavedDesign}
                    type="button"
                >
                    Revert unsaved
                </button>
                <button
                    className="min-h-10 rounded-lg border border-stone-300 px-3 text-sm font-medium disabled:opacity-40"
                    disabled={pending}
                    onClick={resetCurrentScope}
                    type="button"
                >
                    Reset this scope
                </button>
                <button
                    className="min-h-10 rounded-lg border border-red-200 px-3 text-sm font-medium text-red-800 disabled:opacity-40"
                    disabled={pending}
                    onClick={resetEverything}
                    type="button"
                >
                    Reset all to defaults
                </button>
            </div>

            <section aria-label="Search design settings" className="design-studio-search mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-stone-300 bg-white p-3">
                <label className="min-w-56 flex-1 text-sm font-medium">
                    Find settings
                    <input
                        className="mt-1 min-h-11 w-full rounded-lg border border-stone-300 px-3"
                        onChange={(event) => setSettingsSearch(event.target.value)}
                        placeholder="Try colors, typography, layout, or gallery"
                        type="search"
                        value={settingsSearch}
                    />
                </label>
                {settingsSearch && (
                    <button className="min-h-10 rounded-lg border border-stone-300 px-3 text-sm" onClick={() => setSettingsSearch("")} type="button">
                        Clear search
                    </button>
                )}
                {contrastWarnings.length > 0 && (
                    <div aria-live="polite" className="w-full rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
                        <strong>Contrast warning:</strong>{" "}
                        {contrastWarnings.map(({ label, ratio }) => `${label} (${ratio.toFixed(2)}:1)`).join(", ")}
                        {" "}may be difficult to read; aim for at least 4.5:1.
                    </div>
                )}
            </section>

            <div className="design-studio-workspace mt-8 grid items-start gap-6 xl:grid-cols-[minmax(280px,0.8fr)_minmax(520px,1.55fr)_minmax(300px,0.9fr)] 2xl:gap-7">
                <section aria-label="Design controls" className="design-studio-controls min-w-0 space-y-4 xl:sticky xl:top-4 xl:max-h-[calc(100dvh-2rem)] xl:overflow-y-auto xl:overscroll-contain">
                    <div className="rounded-2xl border border-[var(--site-border-color)] bg-[var(--site-surface)] p-5 shadow-[var(--site-shadow)] sm:p-7">
                        <h2 className="text-xl font-semibold">Choose what you are styling</h2>
                        <p className="mt-2 text-sm leading-6 text-[var(--site-muted)]">
                            Pick a site-wide look or a page-specific profile before adjusting its style.
                        </p>
                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                            <label className="block text-sm font-medium">
                                Design scope
                                <CustomDropdown
                                    ariaLabel="Design scope"
                                    buttonClassName="mt-2 flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border border-stone-300 bg-white px-3 text-left"
                                    onChange={changeScope}
                                    options={[
                                        { value: "__global__", label: "Entire site (defaults)" },
                                        ...allPagePaths.map((path) => ({
                                            value: path,
                                            label: pageChoices.find((page) => page.path === path)?.label ?? path,
                                        })),
                                    ]}
                                    value={selectedPage}
                                />
                            </label>
                            <label className="block text-sm font-medium">
                                Layout preset
                                <CustomDropdown
                                    ariaLabel="Layout preset"
                                    buttonClassName="mt-2 flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border border-stone-300 bg-white px-3 text-left"
                                    onChange={selectPreset}
                                    options={[
                                        { value: "", label: "Custom design" },
                                        ...builtInLayoutPresets.map((preset) => ({
                                            value: preset.id,
                                            label: `${preset.name} (Built-in)`,
                                        })),
                                        ...customPresets.map((preset) => ({
                                            value: preset.id,
                                            label: `${preset.name} (Saved)`,
                                        })),
                                    ]}
                                    value={activePresetId}
                                />
                            </label>
                        </div>

                        <div className="mt-5 flex flex-wrap items-end gap-3 rounded-xl bg-stone-50 p-4">
                            <label className="min-w-56 flex-1 text-sm font-medium">
                                Add a route profile
                                <input
                                    className="mt-2 min-h-11 w-full rounded-lg border border-stone-300 bg-white px-3"
                                    onChange={(event) => setNewPagePath(event.target.value)}
                                    placeholder="/memories/[slug]"
                                    value={newPagePath}
                                />
                            </label>
                            <button
                                className="min-h-11 rounded-lg border border-stone-300 bg-white px-4 font-medium"
                                onClick={addPageProfile}
                                type="button"
                            >
                                Add page
                            </button>
                            {!isGlobal && (
                                <button
                                    className="min-h-11 rounded-lg border border-stone-300 px-4 font-medium"
                                    onClick={resetPageProfile}
                                    type="button"
                                >
                                    Inherit site design
                                </button>
                            )}
                        </div>

                        <p className="mt-4 text-sm leading-6 text-[var(--site-muted)]">
                            Route profiles can use dynamic segments such as <code>/photo/[id]</code>. Exact routes and
                            dynamic templates are matched automatically; pages without an override inherit the site defaults.
                            A route profile controls styling; the page itself still needs to exist in the app.
                        </p>
                    </div>

                    {!isGlobal && selectedPage === "/gallery" && settingsMatch("gallery exhibition collection colors text photos album browser title description metadata brand navigation masthead headline hero featured work visit footer layout photo collage status empty") && (
                            <details open={Boolean(settingsSearch)} className="mb-4 rounded-2xl border border-[var(--site-border-color)] bg-[var(--site-surface)] p-4 shadow-[var(--site-shadow)] sm:p-5">
                                <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.16em] text-[var(--site-accent)]">
                                    Public gallery settings
                                </summary>
                                <h2 className="mt-2 text-xl font-semibold">Words and page composition</h2>
                                <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--site-muted)]">
                                    Edit every piece of gallery copy and choose which sections and photo layouts are shown.
                                    Page text updates the live preview; browser and search metadata takes effect on the saved page.
                                    These gallery settings do not restyle this editor.
                                </p>

                                <div className="mt-6 space-y-6">
                                    <div className="border-t border-[var(--site-border-color)] pt-5">
                                        <h3 className="text-sm font-semibold">Gallery colors</h3>
                                        <p className="mt-1 text-sm text-[var(--site-muted)]">
                                            Change each part independently. Section colors fall back to the page background until you customize them.
                                        </p>
                                        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                            <ColorControl label="Page background" value={tokens.background} onChange={(value) => updateToken("background", value)} />
                                            <ColorControl label="Header background" value={galleryContent.headerBackground ?? tokens.background} onChange={(value) => updateGalleryContent("headerBackground", value)} />
                                            <ColorControl label="Exhibition section" value={galleryContent.heroBackground ?? tokens.background} onChange={(value) => updateGalleryContent("heroBackground", value)} />
                                            <ColorControl label="Featured section" value={galleryContent.featuredBackground ?? tokens.background} onChange={(value) => updateGalleryContent("featuredBackground", value)} />
                                            <ColorControl label="Collection section" value={galleryContent.collectionBackground ?? tokens.surface} onChange={(value) => updateGalleryContent("collectionBackground", value)} />
                                            <ColorControl label="Visit section" value={galleryContent.visitBackground ?? tokens.background} onChange={(value) => updateGalleryContent("visitBackground", value)} />
                                            <ColorControl label="Footer background" value={galleryContent.footerBackground ?? tokens.background} onChange={(value) => updateGalleryContent("footerBackground", value)} />
                                            <ColorControl label="Photo card background" value={galleryContent.photoCardBackground ?? tokens.surface} onChange={(value) => updateGalleryContent("photoCardBackground", value)} />
                                            <ColorControl label="Photo card border" value={galleryContent.photoCardBorder ?? tokens.borderColor} onChange={(value) => updateGalleryContent("photoCardBorder", value)} />
                                            <ColorControl label="Cover photo frame" value={galleryContent.collageFrameBackground ?? tokens.surface} onChange={(value) => updateGalleryContent("collageFrameBackground", value)} />
                                            <ColorControl label="Main text" value={tokens.text} onChange={(value) => updateToken("text", value)} />
                                            <ColorControl label="Secondary text" value={tokens.muted} onChange={(value) => updateToken("muted", value)} />
                                            <ColorControl label="Accent" value={tokens.accent} onChange={(value) => updateToken("accent", value)} />
                                            <ColorControl label="Visit button" value={tokens.buttonBackground} onChange={(value) => updateToken("buttonBackground", value)} />
                                            <ColorControl label="Visit button text" value={tokens.buttonText} onChange={(value) => updateToken("buttonText", value)} />
                                            <ColorControl label="Visit button hover" value={tokens.hoverBackground} onChange={(value) => updateToken("hoverBackground", value)} />
                                            <ColorControl label="Visit button hover text" value={tokens.hoverText} onChange={(value) => updateToken("hoverText", value)} />
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-semibold">Browser and search text</h3>
                                        <div className="mt-3 grid gap-4 sm:grid-cols-2">
                                            <GalleryTextControl field="pageTitle" label="Page title" value={galleryContent.pageTitle} onChange={(value) => updateGalleryContent("pageTitle", value)} />
                                            <GalleryTextControl field="pageDescription" label="Page description" value={galleryContent.pageDescription} onChange={(value) => updateGalleryContent("pageDescription", value)} multiline />
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-semibold">Masthead and navigation</h3>
                                        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                            <GalleryTextControl field="brandName" label="Brand name" value={galleryContent.brandName} onChange={(value) => updateGalleryContent("brandName", value)} />
                                            <GalleryTextControl field="brandDescriptor" label="Brand descriptor" value={galleryContent.brandDescriptor} onChange={(value) => updateGalleryContent("brandDescriptor", value)} />
                                            <GalleryTextControl field="exhibitionNavLabel" label="Exhibition link" value={galleryContent.exhibitionNavLabel} onChange={(value) => updateGalleryContent("exhibitionNavLabel", value)} />
                                            <GalleryTextControl field="collectionNavLabel" label="Collection link" value={galleryContent.collectionNavLabel} onChange={(value) => updateGalleryContent("collectionNavLabel", value)} />
                                            <GalleryTextControl field="visitNavLabel" label="Visit link" value={galleryContent.visitNavLabel} onChange={(value) => updateGalleryContent("visitNavLabel", value)} />
                                        </div>
                                    </div>

                                    <div className="border-t border-[var(--site-border-color)] pt-5">
                                        <h3 className="text-sm font-semibold">Exhibition introduction</h3>
                                        <div className="mt-3 grid gap-4 sm:grid-cols-2">
                                            <GalleryTextControl field="exhibitionNumber" label="Exhibition number" value={galleryContent.exhibitionNumber} onChange={(value) => updateGalleryContent("exhibitionNumber", value)} />
                                            <GalleryTextControl field="statusLabel" label="Status label" value={galleryContent.statusLabel} onChange={(value) => updateGalleryContent("statusLabel", value)} />
                                            <GalleryTextControl field="workSingularLabel" label="Singular work label" value={galleryContent.workSingularLabel} onChange={(value) => updateGalleryContent("workSingularLabel", value)} />
                                            <GalleryTextControl field="workPluralLabel" label="Plural work label" value={galleryContent.workPluralLabel} onChange={(value) => updateGalleryContent("workPluralLabel", value)} />
                                            <GalleryTextControl field="heroTitle" label="Headline" value={galleryContent.heroTitle} onChange={(value) => updateGalleryContent("heroTitle", value)} />
                                            <GalleryTextControl field="heroEmphasis" label="Emphasized headline" value={galleryContent.heroEmphasis} onChange={(value) => updateGalleryContent("heroEmphasis", value)} />
                                            <GalleryTextControl field="heroDescription" label="Introduction" value={galleryContent.heroDescription} onChange={(value) => updateGalleryContent("heroDescription", value)} multiline />
                                            <GalleryTextControl field="collageEmptyLabel" label="Empty collage label" value={galleryContent.collageEmptyLabel} onChange={(value) => updateGalleryContent("collageEmptyLabel", value)} />
                                            <GalleryTextControl field="photoOpenLabel" label="Photo link label" value={galleryContent.photoOpenLabel} onChange={(value) => updateGalleryContent("photoOpenLabel", value)} />
                                        </div>
                                    </div>

                                    <div className="border-t border-[var(--site-border-color)] pt-5">
                                        <h3 className="text-sm font-semibold">Featured work and collection</h3>
                                        <div className="mt-3 grid gap-4 sm:grid-cols-2">
                                            <GalleryTextControl field="featuredLabel" label="Featured-work label" value={galleryContent.featuredLabel} onChange={(value) => updateGalleryContent("featuredLabel", value)} />
                                            <GalleryTextControl field="featuredRoomLabel" label="Featured room label" value={galleryContent.featuredRoomLabel} onChange={(value) => updateGalleryContent("featuredRoomLabel", value)} />
                                            <GalleryTextControl field="featuredByline" label="Featured byline" value={galleryContent.featuredByline} onChange={(value) => updateGalleryContent("featuredByline", value)} />
                                            <GalleryTextControl field="featuredMeta" label="Featured photo detail" value={galleryContent.featuredMeta} onChange={(value) => updateGalleryContent("featuredMeta", value)} />
                                            <GalleryTextControl field="collectionLabel" label="Collection eyebrow" value={galleryContent.collectionLabel} onChange={(value) => updateGalleryContent("collectionLabel", value)} />
                                            <GalleryTextControl field="collectionTitle" label="Collection heading" value={galleryContent.collectionTitle} onChange={(value) => updateGalleryContent("collectionTitle", value)} />
                                            <GalleryTextControl field="photoSingularLabel" label="Singular photo count label" value={galleryContent.photoSingularLabel} onChange={(value) => updateGalleryContent("photoSingularLabel", value)} />
                                            <GalleryTextControl field="photoPluralLabel" label="Plural photo count label" value={galleryContent.photoPluralLabel} onChange={(value) => updateGalleryContent("photoPluralLabel", value)} />
                                        </div>
                                    </div>

                                    <div className="border-t border-[var(--site-border-color)] pt-5">
                                        <h3 className="text-sm font-semibold">Visit and closing note</h3>
                                        <div className="mt-3 grid gap-4 sm:grid-cols-2">
                                            <GalleryTextControl field="visitLabel" label="Visit eyebrow" value={galleryContent.visitLabel} onChange={(value) => updateGalleryContent("visitLabel", value)} />
                                            <GalleryTextControl field="visitTitle" label="Visit heading" value={galleryContent.visitTitle} onChange={(value) => updateGalleryContent("visitTitle", value)} />
                                            <GalleryTextControl field="visitDescription" label="Visit message" value={galleryContent.visitDescription} onChange={(value) => updateGalleryContent("visitDescription", value)} multiline />
                                            <GalleryTextControl field="visitLinkLabel" label="Visit link label" value={galleryContent.visitLinkLabel} onChange={(value) => updateGalleryContent("visitLinkLabel", value)} />
                                            <GalleryTextControl field="emptyTitle" label="Empty collection heading" value={galleryContent.emptyTitle} onChange={(value) => updateGalleryContent("emptyTitle", value)} />
                                            <GalleryTextControl field="emptyDescription" label="Empty collection message" value={galleryContent.emptyDescription} onChange={(value) => updateGalleryContent("emptyDescription", value)} multiline />
                                            <GalleryTextControl field="footerNote" label="Footer note" value={galleryContent.footerNote} onChange={(value) => updateGalleryContent("footerNote", value)} />
                                            <GalleryTextControl field="backToTopLabel" label="Back-to-top link" value={galleryContent.backToTopLabel} onChange={(value) => updateGalleryContent("backToTopLabel", value)} />
                                        </div>
                                    </div>

                                    <div className="border-t border-[var(--site-border-color)] pt-5">
                                        <h3 className="text-sm font-semibold">Sections and layout</h3>
                                        <div className="mt-3 grid gap-4 sm:grid-cols-2">
                                            <GalleryToggle label="Show masthead and navigation" checked={galleryContent.showHeader} onChange={(value) => updateGalleryContent("showHeader", value)} />
                                            <GalleryToggle label="Show work count" checked={galleryContent.showStatus} onChange={(value) => updateGalleryContent("showStatus", value)} />
                                            <GalleryToggle label="Show layered cover collage" checked={galleryContent.showCollage} onChange={(value) => updateGalleryContent("showCollage", value)} />
                                            <GalleryToggle label="Show featured photograph" checked={galleryContent.showFeatured} onChange={(value) => updateGalleryContent("showFeatured", value)} />
                                            <GalleryToggle label="Show full collection" checked={galleryContent.showCollection} onChange={(value) => updateGalleryContent("showCollection", value)} />
                                            <GalleryToggle label="Show visit section" checked={galleryContent.showVisit} onChange={(value) => updateGalleryContent("showVisit", value)} />
                                            <GalleryToggle label="Show footer" checked={galleryContent.showFooter} onChange={(value) => updateGalleryContent("showFooter", value)} />
                                            <RangeControl label="Collection columns" value={galleryContent.collectionColumns} min={2} max={5} unit="" onChange={(value) => updateGalleryContent("collectionColumns", value)} />
                                            <RangeControl label="Cover collage photographs" value={galleryContent.collageImageCount} min={3} max={7} unit="" onChange={(value) => updateGalleryContent("collageImageCount", value)} />
                                            <RangeControl label="Hero heading scale" value={galleryContent.heroScale} min={150} max={400} step={10} unit="%" onChange={(value) => updateGalleryContent("heroScale", value)} />
                                            <RangeControl label="Gallery content width" value={tokens.pageWidth} min={640} max={1600} unit="px" onChange={(value) => updateToken("pageWidth", value)} />
                                            <RangeControl label="Gallery side padding" value={tokens.pagePadding} min={12} max={96} unit="px" onChange={(value) => updateToken("pagePadding", value)} />
                                            <RangeControl label="Gallery section spacing" value={tokens.sectionSpacing} min={8} max={96} unit="px" onChange={(value) => updateToken("sectionSpacing", value)} />
                                            <RangeControl label="Photo card corners" value={tokens.cornerRadius} min={0} max={40} unit="px" onChange={(value) => updateToken("cornerRadius", value)} />
                                            <RangeControl label="Border thickness" value={tokens.borderWidth} min={0} max={8} unit="px" onChange={(value) => updateToken("borderWidth", value)} />
                                            <FontControl label="Gallery headings" value={tokens.headingFont} onChange={(value) => updateToken("headingFont", value)} />
                                            <FontControl label="Gallery body text" value={tokens.bodyFont} onChange={(value) => updateToken("bodyFont", value)} />
                                            <RangeControl label="Heading size" value={tokens.headingSize} min={20} max={64} unit="px" onChange={(value) => updateToken("headingSize", value)} />
                                            <RangeControl label="Body text size" value={tokens.bodySize} min={12} max={24} unit="px" onChange={(value) => updateToken("bodySize", value)} />
                                            <label className="block text-sm font-medium">
                                                Photo card shadow
                                                <CustomDropdown<DesignTokens["shadow"]>
                                                    ariaLabel="Photo card shadow"
                                                    buttonClassName="mt-2 flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border border-stone-300 bg-white px-3 text-left"
                                                    onChange={(value) => updateToken("shadow", value)}
                                                    options={[
                                                        { value: "none", label: "None" },
                                                        { value: "soft", label: "Soft" },
                                                        { value: "strong", label: "Strong" },
                                                    ]}
                                                    value={tokens.shadow}
                                                />
                                            </label>
                                            <label className="block text-sm font-medium">
                                                Photo card border style
                                                <CustomDropdown<DesignTokens["borderStyle"]>
                                                    ariaLabel="Photo card border style"
                                                    buttonClassName="mt-2 flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border border-stone-300 bg-white px-3 text-left"
                                                    onChange={(value) => updateToken("borderStyle", value)}
                                                    options={[
                                                        { value: "none", label: "None" },
                                                        { value: "solid", label: "Solid" },
                                                        { value: "double", label: "Double" },
                                                        { value: "dashed", label: "Dashed" },
                                                    ]}
                                                    value={tokens.borderStyle}
                                                />
                                            </label>
                                            <label className="block text-sm font-medium">
                                                Collection layout
                                                <CustomDropdown<GalleryContent["collectionLayout"]>
                                                    ariaLabel="Collection layout"
                                                    buttonClassName="mt-2 flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border border-stone-300 bg-white px-3 text-left"
                                                    onChange={(value) => updateGalleryContent("collectionLayout", value)}
                                                    options={[
                                                        { value: "grid", label: "Even grid" },
                                                        { value: "masonry", label: "Editorial masonry" },
                                                    ]}
                                                    value={galleryContent.collectionLayout}
                                                />
                                            </label>
                                            <label className="block text-sm font-medium">
                                                Featured photograph position
                                                <CustomDropdown<GalleryContent["featureImageSide"]>
                                                    ariaLabel="Featured photograph position"
                                                    buttonClassName="mt-2 flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border border-stone-300 bg-white px-3 text-left"
                                                    onChange={(value) => updateGalleryContent("featureImageSide", value)}
                                                    options={[
                                                        { value: "left", label: "Image on left" },
                                                        { value: "right", label: "Image on right" },
                                                    ]}
                                                    value={galleryContent.featureImageSide}
                                                />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    className="mt-5 min-h-9 rounded-lg border border-stone-300 px-3 text-sm"
                                    onClick={() => resetGallerySection(Object.keys(galleryContentSchema.shape) as Array<keyof GalleryContent>)}
                                    type="button"
                                >
                                    Reset gallery section
                                </button>
                            </details>
                        )}

                    {isUploadProfile && (
                        <section className="rounded-2xl border border-[var(--site-border-color)] bg-[var(--site-surface)] p-5 sm:p-7">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--site-accent)]">
                                Photo studio
                            </p>
                            <h2 className="mt-2 text-xl font-semibold">Upload screen appearance</h2>
                            <p className="mt-2 text-sm leading-6 text-[var(--site-muted)]">
                                These controls target the upload page only. Upload forms, photo cards, and their text use these colors and type settings.
                            </p>
                            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                <ColorControl label="Page background" value={tokens.background} onChange={(value) => updateToken("background", value)} />
                                <ColorControl label="Panel background" value={tokens.surface} onChange={(value) => updateToken("surface", value)} />
                                <ColorControl label="Main text" value={tokens.text} onChange={(value) => updateToken("text", value)} />
                                <ColorControl label="Secondary text" value={tokens.muted} onChange={(value) => updateToken("muted", value)} />
                                <ColorControl label="Accent and focus" value={tokens.accent} onChange={(value) => updateToken("accent", value)} />
                                <ColorControl label="Borders" value={tokens.borderColor} onChange={(value) => updateToken("borderColor", value)} />
                                <ColorControl label="Primary button" value={tokens.buttonBackground} onChange={(value) => updateToken("buttonBackground", value)} />
                                <ColorControl label="Primary button text" value={tokens.buttonText} onChange={(value) => updateToken("buttonText", value)} />
                                <ColorControl label="Button hover" value={tokens.hoverBackground} onChange={(value) => updateToken("hoverBackground", value)} />
                                <ColorControl label="Button hover text" value={tokens.hoverText} onChange={(value) => updateToken("hoverText", value)} />
                            </div>
                            <div className="mt-5 grid gap-4 sm:grid-cols-2">
                                <FontControl label="Headings" value={tokens.headingFont} onChange={(value) => updateToken("headingFont", value)} />
                                <FontControl label="Form and body text" value={tokens.bodyFont} onChange={(value) => updateToken("bodyFont", value)} />
                                <RangeControl label="Heading size" value={tokens.headingSize} min={20} max={64} unit="px" onChange={(value) => updateToken("headingSize", value)} />
                                <RangeControl label="Body size" value={tokens.bodySize} min={12} max={24} unit="px" onChange={(value) => updateToken("bodySize", value)} />
                                 <label className="block text-sm font-medium">
                                     Upload width
                                     <CustomDropdown<DesignTokens["uploadContentWidth"]>
                                         ariaLabel="Upload content width"
                                         buttonClassName="mt-2 flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border border-stone-300 bg-white px-3 text-left"
                                         onChange={(value) => updateToken("uploadContentWidth", value)}
                                         options={[
                                             { value: "fluid", label: "Fluid — fill the viewport" },
                                             { value: "contained", label: "Contained — use content width" },
                                         ]}
                                         value={tokens.uploadContentWidth}
                                     />
                                 </label>
                                 {tokens.uploadContentWidth === "contained" && (
                                     <RangeControl label="Content width" value={tokens.pageWidth} min={640} max={1600} unit="px" onChange={(value) => updateToken("pageWidth", value)} />
                                 )}
                                <RangeControl label="Page side padding" value={tokens.pagePadding} min={12} max={96} unit="px" onChange={(value) => updateToken("pagePadding", value)} />
                                <RangeControl label="Panel corners" value={tokens.cornerRadius} min={0} max={40} unit="px" onChange={(value) => updateToken("cornerRadius", value)} />
                                <RangeControl label="Border thickness" value={tokens.borderWidth} min={0} max={8} unit="px" onChange={(value) => updateToken("borderWidth", value)} />
                                <label className="block text-sm font-medium">
                                    Panel shadow
                                    <CustomDropdown<DesignTokens["shadow"]>
                                        ariaLabel="Panel shadow"
                                        buttonClassName="mt-2 flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border border-stone-300 bg-white px-3 text-left"
                                        onChange={(value) => updateToken("shadow", value)}
                                        options={[
                                            { value: "none", label: "None" },
                                            { value: "soft", label: "Soft" },
                                            { value: "strong", label: "Strong" },
                                        ]}
                                        value={tokens.shadow}
                                    />
                                </label>
                            </div>
                        </section>
                    )}

                    {!isGalleryProfile && !isUploadProfile && (
                    <>
                    {settingsMatch("colors background surface text muted accent borders button hover") && <details open={Boolean(settingsSearch)} className="rounded-2xl border border-[var(--site-border-color)] bg-[var(--site-surface)] p-4 shadow-[var(--site-shadow)] sm:p-5">
                        <summary className="cursor-pointer text-lg font-semibold">Colors <span className="ml-2 text-xs font-normal text-[var(--site-muted)]">Site-wide palette and buttons</span></summary>
                        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <ColorControl label="Page background" value={tokens.background} onChange={(value) => updateToken("background", value)} />
                            <ColorControl label="Card / surface" value={tokens.surface} onChange={(value) => updateToken("surface", value)} />
                            <ColorControl label="Main text" value={tokens.text} onChange={(value) => updateToken("text", value)} />
                            <ColorControl label="Muted text" value={tokens.muted} onChange={(value) => updateToken("muted", value)} />
                            <ColorControl label="Accent" value={tokens.accent} onChange={(value) => updateToken("accent", value)} />
                            <ColorControl label="Borders" value={tokens.borderColor} onChange={(value) => updateToken("borderColor", value)} />
                            <ColorControl label="Button background" value={tokens.buttonBackground} onChange={(value) => updateToken("buttonBackground", value)} />
                            <ColorControl label="Button text" value={tokens.buttonText} onChange={(value) => updateToken("buttonText", value)} />
                            <ColorControl label="Hover background" value={tokens.hoverBackground} onChange={(value) => updateToken("hoverBackground", value)} />
                            <ColorControl label="Hover text" value={tokens.hoverText} onChange={(value) => updateToken("hoverText", value)} />
                        </div>
                        <div className="mt-5 flex flex-wrap items-center gap-4 rounded-xl border border-[var(--site-border-color)] bg-[var(--site-background)] p-4">
                            <p className="text-sm font-medium">Button preview</p>
                            <button
                                className="site-primary-button rounded-xl px-5 py-3 font-semibold transition"
                                onClick={(event) => event.preventDefault()}
                                style={{ backgroundColor: tokens.buttonBackground, color: tokens.buttonText }}
                                type="button"
                            >
                                Primary action
                            </button>
                            <p className="text-xs text-[var(--site-muted)]">Hover to preview hover colors.</p>
                        </div>
                        <button className="mt-4 min-h-9 rounded-lg border border-stone-300 px-3 text-sm" onClick={() => resetTokenSection(["background", "surface", "text", "muted", "accent", "borderColor", "buttonBackground", "buttonText", "hoverBackground", "hoverText"])} type="button">
                            Reset this section
                        </button>
                    </details>}

                    {settingsMatch("typography font heading body size weight line-height alignment") && <details open={Boolean(settingsSearch)} className="rounded-2xl border border-[var(--site-border-color)] bg-[var(--site-surface)] p-4 shadow-[var(--site-shadow)] sm:p-5">
                        <summary className="cursor-pointer text-lg font-semibold">Typography <span className="ml-2 text-xs font-normal text-[var(--site-muted)]">Fonts, sizes, and text flow</span></summary>
                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                            <FontControl label="Heading font" value={tokens.headingFont} onChange={(value) => updateToken("headingFont", value)} />
                            <FontControl label="Body font" value={tokens.bodyFont} onChange={(value) => updateToken("bodyFont", value)} />
                            <RangeControl label="Heading size" value={tokens.headingSize} min={20} max={64} unit="px" onChange={(value) => updateToken("headingSize", value)} />
                            <RangeControl label="Body size" value={tokens.bodySize} min={12} max={24} unit="px" onChange={(value) => updateToken("bodySize", value)} />
                            <label className="block text-sm font-medium">
                                Heading weight
                                <CustomDropdown<DesignTokens["headingWeight"]>
                                    ariaLabel="Heading weight"
                                    buttonClassName="mt-2 flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border border-stone-300 bg-white px-3 text-left"
                                    onChange={(value) => updateToken("headingWeight", value)}
                                    options={[
                                        { value: "normal", label: "Normal" },
                                        { value: "semibold", label: "Semibold" },
                                        { value: "bold", label: "Bold" },
                                    ]}
                                    value={tokens.headingWeight}
                                />
                            </label>
                            <RangeControl label="Line height" value={tokens.lineHeight} min={1.2} max={2.2} step={0.1} unit="" onChange={(value) => updateToken("lineHeight", value)} />
                            <label className="block text-sm font-medium">
                                Text alignment
                                <CustomDropdown<DesignTokens["alignment"]>
                                    ariaLabel="Text alignment"
                                    buttonClassName="mt-2 flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border border-stone-300 bg-white px-3 text-left"
                                    onChange={(value) => updateToken("alignment", value)}
                                    options={[
                                        { value: "left", label: "Left" },
                                        { value: "center", label: "Centered" },
                                    ]}
                                    value={tokens.alignment}
                                />
                            </label>
                        </div>
                        <button className="mt-4 min-h-9 rounded-lg border border-stone-300 px-3 text-sm" onClick={() => resetTokenSection(["headingFont", "bodyFont", "headingSize", "bodySize", "headingWeight", "lineHeight", "alignment"])} type="button">
                            Reset this section
                        </button>
                    </details>}

                    {settingsMatch("layout spacing width padding corner radius border shadow") && <details open={Boolean(settingsSearch)} className="rounded-2xl border border-[var(--site-border-color)] bg-[var(--site-surface)] p-4 shadow-[var(--site-shadow)] sm:p-5">
                        <summary className="cursor-pointer text-lg font-semibold">Layout and spacing <span className="ml-2 text-xs font-normal text-[var(--site-muted)]">Page width, spacing, borders, and shadows</span></summary>
                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                            <RangeControl label="Content width" value={tokens.pageWidth} min={640} max={1600} unit="px" onChange={(value) => updateToken("pageWidth", value)} />
                            <RangeControl label="Page side padding" value={tokens.pagePadding} min={12} max={96} unit="px" onChange={(value) => updateToken("pagePadding", value)} />
                            <RangeControl label="Corner roundness" value={tokens.cornerRadius} min={0} max={40} unit="px" onChange={(value) => updateToken("cornerRadius", value)} />
                            <RangeControl label="Border thickness" value={tokens.borderWidth} min={0} max={8} unit="px" onChange={(value) => updateToken("borderWidth", value)} />
                            <label className="block text-sm font-medium">
                                Border style
                                <CustomDropdown<DesignTokens["borderStyle"]>
                                    ariaLabel="Border style"
                                    buttonClassName="mt-2 flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border border-stone-300 bg-white px-3 text-left"
                                    onChange={(value) => updateToken("borderStyle", value)}
                                    options={[
                                        { value: "none", label: "None" },
                                        { value: "solid", label: "Solid" },
                                        { value: "double", label: "Double / ornate" },
                                        { value: "dashed", label: "Dashed" },
                                    ]}
                                    value={tokens.borderStyle}
                                />
                            </label>
                            <label className="block text-sm font-medium">
                                Shadow
                                <CustomDropdown<DesignTokens["shadow"]>
                                    ariaLabel="Shadow"
                                    buttonClassName="mt-2 flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border border-stone-300 bg-white px-3 text-left"
                                    onChange={(value) => updateToken("shadow", value)}
                                    options={[
                                        { value: "none", label: "None" },
                                        { value: "soft", label: "Soft" },
                                        { value: "strong", label: "Strong" },
                                    ]}
                                    value={tokens.shadow}
                                />
                            </label>
                        </div>
                        <button className="mt-4 min-h-9 rounded-lg border border-stone-300 px-3 text-sm" onClick={() => resetTokenSection(["layout", "pageWidth", "pagePadding", "sectionSpacing", "cornerRadius", "borderStyle", "borderWidth", "shadow"])} type="button">
                            Reset this section
                        </button>
                    </details>}
                    </>
                    )}

                    <form
                        className="flex flex-wrap items-end gap-3 rounded-2xl border border-[var(--site-border-color)] bg-[var(--site-surface)] p-5"
                        onSubmit={savePreset}
                    >
                        <label className="min-w-56 flex-1 text-sm font-medium">
                            Save the current look as a reusable preset
                            <input
                                className="mt-2 min-h-11 w-full rounded-lg border border-stone-300 bg-white px-3"
                                maxLength={50}
                                onChange={(event) => setPresetName(event.target.value)}
                                placeholder="My family style"
                                required
                                value={presetName}
                            />
                        </label>
                        <button className="min-h-11 rounded-lg border border-stone-300 px-4 font-semibold disabled:opacity-60" disabled={pending} type="submit">
                            Save preset
                        </button>
                        {customPresets.some((preset) => preset.id === activePresetId) && (
                            <button
                                className="min-h-11 rounded-lg px-4 font-medium text-red-800 underline disabled:opacity-60"
                                disabled={pending}
                                onClick={deletePreset}
                                type="button"
                            >
                                Delete selected preset
                            </button>
                        )}
                    </form>

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            className="min-h-10 rounded-lg border border-stone-300 px-3 text-sm font-medium"
                            onClick={copyCurrentDesign}
                            type="button"
                        >
                            Copy design settings
                        </button>
                        <button
                            className="min-h-10 rounded-lg border border-stone-300 px-3 text-sm font-medium"
                            onClick={pasteCurrentDesign}
                            type="button"
                        >
                            Paste design settings
                        </button>
                        <span className="text-xs text-[var(--site-muted)]">Copy a style from one page and paste it into another.</span>
                    </div>

                    <div aria-live="polite" className="min-h-6 text-sm">
                        {message && <p className="text-emerald-800">{message}</p>}
                        {error && <p className="text-red-700">{error}</p>}
                    </div>
                </section>

                {!isEmbeddedPreview && (
                    <>
                    <aside aria-label="Live design preview" className="design-preview-sidebar min-w-0 rounded-2xl border border-[var(--site-border-color)] bg-[var(--site-surface)] p-4 shadow-[var(--site-shadow)] sm:p-5 xl:sticky xl:top-4">
                        <div className="mb-4 text-center">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--site-accent)]">Live preview</p>
                                <h2 className="mt-1 text-xl font-semibold">See your changes</h2>
                                <p className="mt-1 text-xs text-[var(--site-muted)]">
                                    {previewDraft ? "Previewing draft changes." : "Previewing the last saved design."}
                                </p>
                            </div>
                            <div className="mt-3 flex flex-wrap justify-center gap-2">
                                <button
                                    aria-pressed={previewDraft}
                                    className={`min-h-10 rounded-lg border px-3 text-sm font-medium ${previewDraft ? "border-[var(--site-accent)] bg-[var(--site-accent)] text-white" : "border-stone-300"}`}
                                    onClick={() => setPreviewDraft(true)}
                                    type="button"
                                >
                                    Draft
                                </button>
                                <button
                                    aria-pressed={!previewDraft}
                                    className={`min-h-10 rounded-lg border px-3 text-sm font-medium ${!previewDraft ? "border-[var(--site-accent)] bg-[var(--site-accent)] text-white" : "border-stone-300"}`}
                                    onClick={() => {
                                        setPreviewDraft(false);
                                        setSelectingElements(false);
                                        setSelectedElements([]);
                                    }}
                                    type="button"
                                >
                                    Saved
                                </button>
                                <button
                                    aria-label="Reload live preview"
                                    className="min-h-10 rounded-lg border border-stone-300 px-3 text-sm font-medium"
                                    onClick={() => setPreviewReloadKey((current) => current + 1)}
                                    type="button"
                                >
                                    Refresh
                                </button>
                            </div>
                        </div>

                        <div className="mb-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                            <label className="block text-sm font-medium">
                                Page to preview
                                <CustomDropdown
                                    ariaLabel="Page to preview"
                                    buttonClassName="mt-1 flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border border-stone-300 bg-white px-3 text-left"
                                    onChange={changePreviewPage}
                                    options={allPagePaths.map((path) => ({
                                        value: path,
                                        label: pageChoices.find((page) => page.path === path)?.label ?? path,
                                    }))}
                                    value={previewPage}
                                />
                            </label>
                            <label className="block text-sm font-medium">
                                Viewport
                                <CustomDropdown
                                    ariaLabel="Viewport"
                                    buttonClassName="mt-1 flex min-h-11 items-center justify-between gap-3 rounded-lg border border-stone-300 bg-white px-3 text-left"
                                    onChange={(value) => {
                                        setPreviewWidth(Number(value));
                                        setSelectedElements([]);
                                    }}
                                    options={viewportOptions.map((viewport) => ({
                                        value: String(viewport.value),
                                        label: viewport.label,
                                    }))}
                                    value={String(previewWidth)}
                                />
                            </label>
                        </div>

                        <div className="mb-2 flex items-center justify-between gap-3 text-xs text-[var(--site-muted)]">
                            <code className="truncate">{concretePreviewPath(previewPage)}</code>
                            <a
                                className="shrink-0 font-medium text-[var(--site-accent)] underline"
                                href={concretePreviewPath(previewPage)}
                                rel="noreferrer"
                                target="_blank"
                            >
                                Open page
                            </a>
                        </div>

                        <DesignPreviewFrame
                            key={previewPage}
                            path={previewPath}
                            reloadKey={previewReloadKey}
                            tokens={previewTokens}
                            elementSizes={previewBaseElementSizes}
                            responsiveElementSizes={previewResponsiveElementSizes}
                            hiddenElements={previewHiddenElements}
                            galleryContent={previewGalleryContent}
                            selecting={selectingElements}
                            onElementsSelected={handleElementsSelected}
                            viewportWidth={previewWidth}
                            previewHeight={1000}
                        />

                        <div className="mt-3 rounded-xl border border-stone-300 bg-white/70 p-4 text-sm leading-6 text-stone-700">
                            This renders the selected route itself, not a sample card. Sign-in-protected pages use your
                            current session. Route patterns use a sample value in the preview URL. An unbuilt route shows
                            the app&apos;s normal not-found page until that page is implemented.
                        </div>
                    </aside>

                    <section
                        aria-label="Element controls"
                        className="design-element-controls min-w-0 rounded-2xl border border-[var(--site-border-color)] bg-[var(--site-surface)] p-4 shadow-[var(--site-shadow)] sm:p-5 xl:sticky xl:top-4 xl:max-h-[calc(100dvh-2rem)] xl:overflow-y-auto xl:overscroll-contain"
                    >
                        <h2 className="mb-3 text-lg font-semibold">Element controls</h2>
                        <div className="min-w-0 rounded-xl border border-stone-300 bg-white/70 p-4">
                            <div className="pt-3">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <p className="mt-1 text-xs leading-5 text-[var(--site-muted)]">
                                            {selectingElements
                                                ? "Click to select. Ctrl-click (or Cmd-click on Mac) more elements; drag any selected element to move the group."
                                                : selectedElement
                                                  ? `Adjust its size, position, colors, typography, spacing, borders, and image fit for ${activeBreakpoint}.`
                                                  : "Choose an element in the preview to edit its size, position, colors, typography, and breakpoint-specific styling."}
                                        </p>
                                    </div>
                                    <button
                                        aria-pressed={selectingElements}
                                        className={`min-h-10 rounded-lg px-4 text-sm font-semibold ${
                                            selectingElements
                                                ? "bg-[var(--site-accent)] text-white"
                                                : "border border-stone-300"
                                        }`}
                                        disabled={!previewDraft}
                                        onClick={() => setSelectingElements((current) => !current)}
                                        type="button"
                                    >
                                        {!previewDraft ? "Select draft to edit" : selectingElements ? "Stop selecting" : "Select an element"}
                                    </button>
                                </div>

                            {selectedElement && (
                                <div className="mt-4 border-t border-stone-200 pt-4">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <p className="min-w-0 text-sm">
                                            {selectedElements.length === 1 ? "Selected" : `${selectedElements.length} elements selected`}
                                            {selectedElements.length === 1 && (
                                                <>
                                                    {" "}<code className="rounded bg-stone-100 px-1.5 py-0.5">{selectedElement.tag}</code>
                                                    <span className="ml-2 break-words font-medium">{selectedElement.label}</span>
                                                </>
                                            )}
                                        </p>
                                        <button
                                            className="min-h-9 rounded-lg border border-stone-300 px-3 text-xs font-medium disabled:opacity-50"
                                            disabled={!hasSelectedElementOverrides}
                                            onClick={resetSelectedElementSize}
                                            type="button"
                                        >
                                            Reset element styling and position
                                        </button>
                                        <button
                                            className="min-h-9 rounded-lg border border-red-200 px-3 text-xs font-medium text-red-800"
                                            onClick={deleteSelectedElement}
                                            type="button"
                                        >
                                            Remove from page
                                        </button>
                                    </div>
                                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                        <ElementValueControl
                                            label="Element width"
                                            value={selectedWidth}
                                            min={16}
                                            max={2400}
                                            onChange={(value) => updateSelectedElementSize("width", value)}
                                        />
                                        <ElementValueControl
                                            label="Element height"
                                            value={selectedHeight}
                                            min={16}
                                            max={2400}
                                            onChange={(value) => updateSelectedElementSize("height", value)}
                                        />
                                        <ElementValueControl
                                            label="Text size"
                                            value={selectedFontSize}
                                            min={8}
                                            max={240}
                                            onChange={(value) => updateSelectedElementSize("fontSize", value)}
                                        />
                                        <ElementValueControl
                                            label="Horizontal position (X)"
                                            value={selectedX}
                                            min={-2400}
                                            max={2400}
                                            onChange={(value) => updateSelectedElementSize("x", value)}
                                        />
                                        <ElementValueControl
                                            label="Vertical position (Y)"
                                            value={selectedY}
                                            min={-2400}
                                            max={2400}
                                            onChange={(value) => updateSelectedElementSize("y", value)}
                                        />
                                    </div>
                                    <details open className="mt-5 rounded-lg border border-stone-200 p-3">
                                        <summary className="cursor-pointer text-sm font-semibold">More element styling</summary>
                                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                            <ColorControl
                                                label="Text color"
                                                value={selectedColor ?? tokens.text}
                                                onChange={(value) => updateSelectedElementSize("color", value)}
                                            />
                                            <ColorControl
                                                label="Background color"
                                                value={selectedBackgroundColor ?? tokens.background}
                                                onChange={(value) => updateSelectedElementSize("backgroundColor", value)}
                                            />
                                            <ColorControl
                                                label="Border color"
                                                value={selectedBorderColor ?? tokens.borderColor}
                                                onChange={(value) => updateSelectedElementSize("borderColor", value)}
                                            />
                                            <label className="block text-sm font-medium">
                                                Element font
                                                <CustomDropdown<"inherit" | DesignTokens["bodyFont"]>
                                                    ariaLabel="Element font"
                                                    buttonClassName="mt-2 flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border border-stone-300 bg-white px-3 text-left"
                                                    onChange={(value) => updateSelectedElementSize("fontFamily", value === "inherit" ? undefined : value)}
                                                    options={[
                                                        { value: "inherit", label: "Inherit" },
                                                        ...fontOptions,
                                                    ]}
                                                    value={selectedElementSize?.fontFamily ?? "inherit"}
                                                />
                                            </label>
                                            <label className="block text-sm font-medium">
                                                Font weight
                                                <CustomDropdown<"inherit" | "normal" | "500" | "600" | "700">
                                                    ariaLabel="Element font weight"
                                                    buttonClassName="mt-2 flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border border-stone-300 bg-white px-3 text-left"
                                                    onChange={(value) => updateSelectedElementSize("fontWeight", value === "inherit" ? undefined : value)}
                                                    options={[
                                                        { value: "inherit", label: "Inherit" },
                                                        { value: "normal", label: "Normal" },
                                                        { value: "500", label: "Medium" },
                                                        { value: "600", label: "Semibold" },
                                                        { value: "700", label: "Bold" },
                                                    ]}
                                                    value={selectedElementSize?.fontWeight ?? "inherit"}
                                                />
                                            </label>
                                            <label className="block text-sm font-medium">
                                                Text alignment
                                                <CustomDropdown<"inherit" | "left" | "center" | "right" | "justify">
                                                    ariaLabel="Element text alignment"
                                                    buttonClassName="mt-2 flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border border-stone-300 bg-white px-3 text-left"
                                                    onChange={(value) => updateSelectedElementSize("textAlign", value === "inherit" ? undefined : value)}
                                                    options={[
                                                        { value: "inherit", label: "Inherit" },
                                                        { value: "left", label: "Left" },
                                                        { value: "center", label: "Center" },
                                                        { value: "right", label: "Right" },
                                                        { value: "justify", label: "Justify" },
                                                    ]}
                                                    value={selectedElementSize?.textAlign ?? "inherit"}
                                                />
                                            </label>
                                            <ElementValueControl
                                                label="Padding"
                                                value={selectedElementSize?.padding ?? selectedElement.padding}
                                                min={0}
                                                max={240}
                                                onChange={(value) => updateSelectedElementSize("padding", value)}
                                            />
                                            <ElementValueControl
                                                label="Corner radius"
                                                value={selectedElementSize?.borderRadius ?? selectedElement.borderRadius}
                                                min={0}
                                                max={240}
                                                onChange={(value) => updateSelectedElementSize("borderRadius", value)}
                                            />
                                            <ElementValueControl
                                                label="Border width"
                                                value={selectedElementSize?.borderWidth ?? selectedElement.borderWidth}
                                                min={0}
                                                max={24}
                                                onChange={(value) => updateSelectedElementSize("borderWidth", value)}
                                            />
                                            <label className="block text-sm font-medium">
                                                Border style
                                                <CustomDropdown<"inherit" | "none" | "solid" | "double" | "dashed">
                                                    ariaLabel="Element border style"
                                                    buttonClassName="mt-2 flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border border-stone-300 bg-white px-3 text-left"
                                                    onChange={(value) => updateSelectedElementSize("borderStyle", value === "inherit" ? undefined : value)}
                                                    options={[
                                                        { value: "inherit", label: "Inherit" },
                                                        { value: "none", label: "None" },
                                                        { value: "solid", label: "Solid" },
                                                        { value: "double", label: "Double" },
                                                        { value: "dashed", label: "Dashed" },
                                                    ]}
                                                    value={selectedElementSize?.borderStyle ?? "inherit"}
                                                />
                                            </label>
                                            <RangeControl
                                                label="Letter spacing"
                                                value={selectedElementSize?.letterSpacing ?? selectedElement.letterSpacing}
                                                min={-8}
                                                max={32}
                                                step={0.5}
                                                unit="px"
                                                onChange={(value) => updateSelectedElementSize("letterSpacing", value)}
                                            />
                                            <RangeControl
                                                label="Line height"
                                                value={selectedElementSize?.lineHeight ?? selectedElement.lineHeight}
                                                min={0.5}
                                                max={4}
                                                step={0.1}
                                                unit=""
                                                onChange={(value) => updateSelectedElementSize("lineHeight", value)}
                                            />
                                            <RangeControl
                                                label="Opacity"
                                                value={selectedElementSize?.opacity ?? selectedElement.opacity}
                                                min={0}
                                                max={1}
                                                step={0.05}
                                                unit=""
                                                onChange={(value) => updateSelectedElementSize("opacity", value)}
                                            />
                                            <label className="block text-sm font-medium">
                                                Image fit
                                                <CustomDropdown<"inherit" | "cover" | "contain" | "fill" | "none" | "scale-down">
                                                    ariaLabel="Image fit"
                                                    buttonClassName="mt-2 flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border border-stone-300 bg-white px-3 text-left"
                                                    onChange={(value) => updateSelectedElementSize("objectFit", value === "inherit" ? undefined : value)}
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
                                            </label>
                                            <label className="block text-sm font-medium">
                                                Text transform
                                                <CustomDropdown<"inherit" | "none" | "uppercase" | "lowercase" | "capitalize">
                                                    ariaLabel="Text transform"
                                                    buttonClassName="mt-2 flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border border-stone-300 bg-white px-3 text-left"
                                                    onChange={(value) => updateSelectedElementSize("textTransform", value === "inherit" ? undefined : value)}
                                                    options={[
                                                        { value: "inherit", label: "Inherit" },
                                                        { value: "none", label: "None" },
                                                        { value: "uppercase", label: "Uppercase" },
                                                        { value: "lowercase", label: "Lowercase" },
                                                        { value: "capitalize", label: "Capitalize" },
                                                    ]}
                                                    value={selectedElementSize?.textTransform ?? "inherit"}
                                                />
                                            </label>
                                        </div>
                                    </details>
                                    <div className="mt-5 rounded-lg bg-stone-50 p-3">
                                        <h4 className="text-sm font-semibold">Quick alignment</h4>
                                        <p className="mt-1 text-xs leading-5 text-[var(--site-muted)]">
                                            With one element, align to its container. With multiple, align to the
                                            selection. Center in page centers the selected group on the page.
                                        </p>
                                        <div className="mt-3 grid grid-cols-3 gap-2">
                                            <QuickActionButton label="Align left" onClick={() => alignSelection("horizontal", "start")} />
                                            <QuickActionButton label="Center horizontally" onClick={() => alignSelection("horizontal", "center")} />
                                            <QuickActionButton label="Align right" onClick={() => alignSelection("horizontal", "end")} />
                                            <QuickActionButton label="Align top" onClick={() => alignSelection("vertical", "start")} />
                                            <QuickActionButton label="Center vertically" onClick={() => alignSelection("vertical", "center")} />
                                            <QuickActionButton label="Align bottom" onClick={() => alignSelection("vertical", "end")} />
                                        </div>
                                        <div className="mt-2 grid grid-cols-2 gap-2">
                                            <QuickActionButton
                                                label="Center in page horizontally"
                                                onClick={() => centerSelectionInPage("horizontal")}
                                            />
                                            <QuickActionButton
                                                label="Center in page vertically"
                                                onClick={() => centerSelectionInPage("vertical")}
                                            />
                                            <QuickActionButton
                                                label="Distribute horizontally"
                                                disabled={selectedElements.length < 3}
                                                onClick={() => distributeSelection("horizontal")}
                                            />
                                            <QuickActionButton
                                                label="Distribute vertically"
                                                disabled={selectedElements.length < 3}
                                                onClick={() => distributeSelection("vertical")}
                                            />
                                            <QuickActionButton
                                                label="Reset positions"
                                                disabled={!selectedElements.some((element) => element.x !== 0 || element.y !== 0)}
                                                onClick={resetSelectedPositions}
                                            />
                                        </div>
                                    </div>
                                    <p className="mt-3 text-xs leading-5 text-[var(--site-muted)]">
                                        Ctrl-click (or Cmd-click) more elements to select them together. Size and X/Y
                                        values apply to every selected element on the <code>{activeBreakpoint}</code> breakpoint of <code>{previewPage}</code>. Drag any
                                        selected element to move them together. Changes are live and
                                        included in Undo, Reset, and Save.
                                    </p>
                                </div>
                            )}

                            {previewHiddenElements.length > 0 && (
                                <div className="mt-4 border-t border-stone-200 pt-4">
                                    <h4 className="text-sm font-semibold">Removed from this page</h4>
                                    <ul className="mt-2 space-y-2">
                                        {previewHiddenElements.map((locator) => (
                                            <li
                                                className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-stone-50 px-3 py-2"
                                                key={locator}
                                            >
                                                <code className="break-all text-xs">{locator}</code>
                                                <button
                                                    className="min-h-9 rounded-lg border border-stone-300 px-3 text-xs font-medium"
                                                    onClick={() => restoreElement(locator)}
                                                    type="button"
                                                >
                                                    Restore
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                    <p className="mt-2 text-xs text-[var(--site-muted)]">
                                        Removed elements stay in the app and can be restored any time.
                                    </p>
                                </div>
                            )}
                            </div>
                        </div>
                    </section>
                    </>
                )}
            </div>
        </main>
    );
}

function concretePreviewPath(path: string): string {
    return path.replace(/\[([^\]]+)\]/g, (_match, parameter: string) =>
        parameter.toLowerCase().includes("token") ? "preview-token" : `preview-${parameter.toLowerCase()}`,
    );
}

function ColorControl({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
    return (
        <label className="flex min-h-12 items-center justify-between gap-3 rounded-lg border border-stone-200 px-3 text-sm font-medium">
            {label}
            <input aria-label={label} className="h-9 w-12 cursor-pointer rounded border-0 bg-transparent p-0" onChange={(event) => onChange(event.target.value)} type="color" value={value} />
        </label>
    );
}

function FontControl({
    label,
    value,
    onChange,
}: {
    label: string;
    value: DesignTokens["headingFont"];
    onChange: (value: DesignTokens["headingFont"]) => void;
}) {
    return (
        <label className="block text-sm font-medium">
            {label}
            <CustomDropdown<DesignTokens["headingFont"]>
                ariaLabel={label}
                buttonClassName="mt-2 flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border border-stone-300 bg-white px-3 text-left"
                onChange={onChange}
                options={fontOptions}
                value={value}
            />
        </label>
    );
}

function RangeControl({
    label,
    value,
    min,
    max,
    step = 1,
    unit,
    onChange,
}: {
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    unit: string;
    onChange: (value: number) => void;
}) {
    return (
        <label className="block text-sm font-medium">
            <span className="flex justify-between gap-3">
                {label}
                <span className="font-normal text-stone-600">{value}{unit}</span>
            </span>
            <input
                className="mt-3 min-h-6 w-full accent-[var(--site-accent)]"
                max={max}
                min={min}
                onChange={(event) => onChange(Number(event.target.value))}
                step={step}
                type="range"
                value={value}
            />
        </label>
    );
}

function GalleryTextControl({
    field,
    label,
    value,
    onChange,
    multiline = false,
}: {
    field: GalleryTextField;
    label: string;
    value: string;
    onChange: (value: string) => void;
    multiline?: boolean;
}) {
    const className = "mt-2 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm";
    const maxLength = galleryContentLimits[field];

    return (
        <label className="block text-sm font-medium">
            {label}
            {multiline ? (
                <textarea
                    className={`${className} min-h-24 resize-y`}
                    maxLength={maxLength}
                    onChange={(event) => onChange(event.target.value)}
                    value={value}
                />
            ) : (
                <input
                    className={`${className} min-h-11`}
                    maxLength={maxLength}
                    onChange={(event) => onChange(event.target.value)}
                    value={value}
                />
            )}
        </label>
    );
}

function GalleryToggle({
    label,
    checked,
    onChange,
}: {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}) {
    return (
        <label className="flex min-h-11 items-center gap-3 rounded-lg border border-stone-200 px-3 text-sm font-medium">
            <input
                checked={checked}
                className="h-4 w-4 accent-[var(--site-accent)]"
                onChange={(event) => onChange(event.target.checked)}
                type="checkbox"
            />
            {label}
        </label>
    );
}

function ElementValueControl({
    label,
    value,
    min,
    max,
    onChange,
}: {
    label: string;
    value: number;
    min: number;
    max: number;
    onChange: (value: number) => void;
}) {
    function commitDraft(rawValue: string) {
        const parsed = Number(rawValue);
        const next = Number.isFinite(parsed)
            ? Math.max(min, Math.min(max, Math.round(parsed)))
            : value;
        onChange(next);
    }

    return (
        <label className="block text-sm font-medium">
            <span className="flex items-center justify-between gap-3">
                {label}
                <span className="flex items-center gap-1 font-normal text-stone-600">
                    <input
                        aria-label={`${label} in pixels`}
                        className="min-h-9 w-20 rounded-md border border-stone-300 px-2 text-right"
                        defaultValue={value}
                        key={value}
                        max={max}
                        min={min}
                        onBlur={(event) => commitDraft(event.currentTarget.value)}
                        onKeyDown={(event) => {
                            if (event.key === "Enter") {
                                event.preventDefault();
                                commitDraft(event.currentTarget.value);
                            }
                        }}
                        type="number"
                    />
                    px
                </span>
            </span>
            <input
                aria-label={label}
                className="mt-3 min-h-6 w-full accent-[var(--site-accent)]"
                max={max}
                min={min}
                onChange={(event) => {
                    onChange(Number(event.target.value));
                }}
                type="range"
                value={value}
            />
        </label>
    );
}

function QuickActionButton({
    label,
    onClick,
    disabled = false,
}: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
}) {
    return (
        <button
            className="min-h-10 rounded-lg border border-stone-300 bg-white px-2 py-1 text-xs font-medium hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-45"
            disabled={disabled}
            onClick={onClick}
            type="button"
        >
            {label}
        </button>
    );
}
