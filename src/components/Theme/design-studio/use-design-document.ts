"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import {
    builtInLayoutPresets,
    defaultDesignTokens,
    defaultGalleryContent,
    designBreakpoints,
    designTokensSchema,
    elementPositionBounds,
    pageKeySchema,
    relativeLuminance,
    resolveDesignTokens,
    resolvePageDesignOverrides,
    type DesignElementSize,
    type DesignElementSizes,
    type DesignPreviewSelection,
    type DesignTokens,
    type GalleryContent,
    type ResponsiveElementSizes,
    type SiteDesign,
} from "@/theme/design-system";
import {
    concretePreviewPath,
    HISTORY_COALESCE_MS,
    PAGE_CHOICES,
    STUDIO_ROUTE,
} from "./constants";
import type {
    ElementBreakpoint,
    NoticeTone,
    PendingAction,
    SavedPreset,
    StudioNotice,
} from "./types";

type PageDesignOverrides = SiteDesign["pages"][string];

const savedPresetResponseSchema = z.object({
    preset: z.object({
        id: z.string(),
        name: z.string(),
        tokens: designTokensSchema,
    }),
});

const EMPTY_SIZES: DesignElementSizes = {};
const EMPTY_RESPONSIVE_SIZES: ResponsiveElementSizes = {};
const EMPTY_HIDDEN: string[] = [];

function responseError(value: unknown, fallback: string): string {
    if (typeof value === "object" && value !== null && "error" in value && typeof value.error === "string") {
        return value.error;
    }

    return fallback;
}

function contrastRatio(foreground: string, background: string) {
    const first = relativeLuminance(foreground);
    const second = relativeLuminance(background);
    return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

function elementBreakpointForWidth(width: number): ElementBreakpoint {
    return width <= designBreakpoints.mobileMax
        ? "mobile"
        : width <= designBreakpoints.tabletMax
          ? "tablet"
          : "desktop";
}

function getElementSizesForBreakpoint(page: PageDesignOverrides, breakpoint: ElementBreakpoint) {
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

function findPresetIdForTokens(tokens: DesignTokens, savedPresets: SavedPreset[]): string {
    const serialized = JSON.stringify(tokens);
    return (
        builtInLayoutPresets.find((preset) => JSON.stringify(preset.tokens) === serialized)?.id ??
        savedPresets.find((preset) => JSON.stringify(preset.tokens) === serialized)?.id ??
        ""
    );
}

function resolveScopeTokens(design: SiteDesign, scope: string): DesignTokens {
    return scope === "__global__"
        ? design.global
        : resolveDesignTokens(design, concretePreviewPath(scope));
}

export function useDesignDocument({
    initialDesign,
    initialPresets,
}: {
    initialDesign: SiteDesign;
    initialPresets: SavedPreset[];
}) {
    const [design, setDesignState] = useState(initialDesign);
    const [savedDesign, setSavedDesign] = useState(initialDesign);
    const [customPresets, setCustomPresets] = useState(initialPresets);
    const [selectedPage, setSelectedPageState] = useState("/gallery");
    const [previewPage, setPreviewPageState] = useState("/gallery");
    const [previewWidth, setPreviewWidthState] = useState(1280);
    const [previewReloadKey, setPreviewReloadKey] = useState(0);
    const [previewDraft, setPreviewDraft] = useState(true);
    const [selectingElements, setSelectingElements] = useState(false);
    const [selectedElements, setSelectedElements] = useState<DesignPreviewSelection[]>([]);
    const [activePresetId, setActivePresetId] = useState(() =>
        findPresetIdForTokens(initialDesign.global, initialPresets),
    );
    const [history, setHistory] = useState<{ past: SiteDesign[]; future: SiteDesign[] }>({
        past: [],
        future: [],
    });
    const [pendingAction, setPendingAction] = useState<PendingAction>(null);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [notice, setNotice] = useState<StudioNotice | null>(null);

    const designRef = useRef(design);
    const savedDesignRef = useRef(savedDesign);
    const customPresetsRef = useRef(customPresets);
    const selectedPageRef = useRef(selectedPage);
    const previewPageRef = useRef(previewPage);
    const previewWidthRef = useRef(previewWidth);
    const previewDraftRef = useRef(previewDraft);
    const selectingElementsRef = useRef(selectingElements);
    const selectedElementsRef = useRef(selectedElements);
    const historyRef = useRef(history);
    const pendingRef = useRef<PendingAction>(null);
    const lastCommitAtRef = useRef(0);
    const noticeIdRef = useRef(0);

    useEffect(() => {
        designRef.current = design;
        savedDesignRef.current = savedDesign;
        customPresetsRef.current = customPresets;
        selectedPageRef.current = selectedPage;
        previewPageRef.current = previewPage;
        previewWidthRef.current = previewWidth;
        previewDraftRef.current = previewDraft;
        selectingElementsRef.current = selectingElements;
        selectedElementsRef.current = selectedElements;
        historyRef.current = history;
    }, [
        customPresets,
        design,
        history,
        previewDraft,
        previewPage,
        previewWidth,
        savedDesign,
        selectedElements,
        selectedPage,
        selectingElements,
    ]);

    const isGlobal = selectedPage === "__global__";
    const isGalleryProfile = selectedPage === "/gallery";
    const isUploadProfile = selectedPage === "/upload";
    const activeBreakpoint = elementBreakpointForWidth(previewWidth);

    const tokens = useMemo<DesignTokens>(
        () => resolveScopeTokens(design, selectedPage),
        [design, selectedPage],
    );

    const galleryContent = useMemo<GalleryContent>(
        () => ({
            ...defaultGalleryContent,
            ...design.pages["/gallery"]?.galleryContent,
        }),
        [design.pages],
    );

    const previewPath = concretePreviewPath(previewPage);
    const previewDesign = previewDraft ? design : savedDesign;
    const previewTokens = useMemo<DesignTokens>(
        () => resolveDesignTokens(previewDesign, previewPath),
        [previewDesign, previewPath],
    );
    const previewPageOverrides = useMemo(
        () => resolvePageDesignOverrides(previewDesign, previewPath),
        [previewDesign, previewPath],
    );
    const previewGalleryContent = useMemo<GalleryContent>(
        () => ({
            ...defaultGalleryContent,
            ...previewPageOverrides?.galleryContent,
        }),
        [previewPageOverrides],
    );
    const previewBaseElementSizes = previewPageOverrides?.elementSizes ?? EMPTY_SIZES;
    const previewResponsiveElementSizes =
        previewPageOverrides?.responsiveElementSizes ?? EMPTY_RESPONSIVE_SIZES;
    const previewCurrentBreakpointSizes =
        activeBreakpoint === "desktop"
            ? EMPTY_SIZES
            : previewResponsiveElementSizes[activeBreakpoint] ?? EMPTY_SIZES;
    const previewElementSizes = useMemo(
        () =>
            Object.fromEntries(
                [
                    ...new Set([
                        ...Object.keys(previewBaseElementSizes),
                        ...Object.keys(previewCurrentBreakpointSizes),
                    ]),
                ].map((locator) => [
                    locator,
                    {
                        ...previewBaseElementSizes[locator],
                        ...previewCurrentBreakpointSizes[locator],
                    },
                ]),
            ),
        [previewBaseElementSizes, previewCurrentBreakpointSizes],
    );
    const previewHiddenElements = previewPageOverrides?.hiddenElements ?? EMPTY_HIDDEN;
    const removedElements = previewHiddenElements;

    const selectedElement = selectedElements[0] ?? null;
    const selectedElementSize = selectedElement
        ? previewElementSizes[selectedElement.locator]
        : undefined;
    const selectedWidth = selectedElementSize?.width ?? Math.max(16, Math.min(2400, selectedElement?.width ?? 16));
    const selectedHeight =
        selectedElementSize?.height ?? Math.max(16, Math.min(2400, selectedElement?.height ?? 16));
    const selectedFontSize =
        selectedElementSize?.fontSize ?? Math.max(8, Math.min(240, selectedElement?.fontSize ?? 16));
    const selectedX = selectedElementSize?.x ?? selectedElement?.x ?? 0;
    const selectedY = selectedElementSize?.y ?? selectedElement?.y ?? 0;
    const selectedColor = selectedElementSize?.color ?? selectedElement?.color;
    const selectedBackgroundColor =
        selectedElementSize?.backgroundColor ?? selectedElement?.backgroundColor;
    const selectedBorderColor = selectedElementSize?.borderColor ?? selectedElement?.borderColor;
    const hasSelectedElementOverrides = selectedElements.some((element) =>
        (activeBreakpoint === "desktop" ? previewBaseElementSizes : previewCurrentBreakpointSizes)[
            element.locator
        ],
    );

    const allPagePaths = useMemo(
        () =>
            [...new Set([...PAGE_CHOICES.map((page) => page.path), ...Object.keys(design.pages)])].filter(
                (path) => path !== STUDIO_ROUTE,
            ),
        [design.pages],
    );
    const isDirty = useMemo(
        () => JSON.stringify(design) !== JSON.stringify(savedDesign),
        [design, savedDesign],
    );
    const isScopeDirty = useMemo(() => {
        const currentScope = isGlobal ? design.global : design.pages[selectedPage];
        const savedScope = isGlobal ? savedDesign.global : savedDesign.pages[selectedPage];
        return JSON.stringify(currentScope) !== JSON.stringify(savedScope);
    }, [design, savedDesign, isGlobal, selectedPage]);
    const hasPageProfile = !isGlobal && Object.prototype.hasOwnProperty.call(design.pages, selectedPage);
    const scopeOverrideCount =
        isGlobal || !design.pages[selectedPage]
            ? 0
            : Object.keys(design.pages[selectedPage]).length;
    const canUndo = history.past.length > 0;
    const canRedo = history.future.length > 0;
    const contrastWarnings = useMemo(
        () =>
            [
                ["Main text", tokens.text, tokens.background],
                ["Secondary text", tokens.muted, tokens.background],
                ["Button text", tokens.buttonText, tokens.buttonBackground],
                ["Hover text", tokens.hoverText, tokens.hoverBackground],
            ].flatMap(([label, foreground, background]) => {
                const ratio = contrastRatio(foreground, background);
                return ratio < 4.5 ? [{ label, ratio }] : [];
            }),
        [tokens],
    );

    const notify = useCallback((tone: NoticeTone, message: string) => {
        noticeIdRef.current += 1;
        setNotice({ id: noticeIdRef.current, tone, message });
    }, []);

    const dismissNotice = useCallback(() => setNotice(null), []);

    const applyDesign = useCallback((next: SiteDesign) => {
        designRef.current = next;
        setDesignState(next);
    }, []);

    const commitDesign = useCallback(
        (next: SiteDesign) => {
            const current = designRef.current;
            if (JSON.stringify(next) === JSON.stringify(current)) {
                return false;
            }

            // Continuous gestures (slider drags, typing) collapse into one undo step.
            const now = Date.now();
            const coalesce =
                now - lastCommitAtRef.current < HISTORY_COALESCE_MS &&
                historyRef.current.past.length > 0;
            lastCommitAtRef.current = now;
            const nextHistory = {
                past: coalesce
                    ? historyRef.current.past
                    : [...historyRef.current.past, current].slice(-50),
                future: [] as SiteDesign[],
            };
            historyRef.current = nextHistory;
            setHistory(nextHistory);
            applyDesign(next);
            setPreviewDraft(true);
            setSaveError(null);
            setNotice(null);
            return true;
        },
        [applyDesign],
    );

    const undoDesign = useCallback(() => {
        const { past, future } = historyRef.current;
        const previous = past[past.length - 1];
        if (!previous) return;

        const current = designRef.current;
        const nextHistory = {
            past: past.slice(0, -1),
            future: [current, ...future].slice(0, 50),
        };
        historyRef.current = nextHistory;
        setHistory(nextHistory);
        applyDesign(previous);
        setNotice(null);
    }, [applyDesign]);

    const redoDesign = useCallback(() => {
        const { past, future } = historyRef.current;
        const next = future[0];
        if (!next) return;

        const current = designRef.current;
        const nextHistory = {
            past: [...past, current].slice(-50),
            future: future.slice(1),
        };
        historyRef.current = nextHistory;
        setHistory(nextHistory);
        applyDesign(next);
        setNotice(null);
    }, [applyDesign]);

    useEffect(() => {
        function handleShortcuts(event: KeyboardEvent) {
            if (!(event.ctrlKey || event.metaKey) || event.altKey) {
                return;
            }

            const target = event.target;
            const isTextEntry =
                target instanceof HTMLElement &&
                (target.isContentEditable ||
                    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

            if (isTextEntry) {
                return;
            }

            const key = event.key.toLowerCase();

            if (key === "z") {
                event.preventDefault();
                if (event.shiftKey) {
                    redoDesign();
                } else {
                    undoDesign();
                }
            } else if (key === "y") {
                event.preventDefault();
                redoDesign();
            }
        }

        window.addEventListener("keydown", handleShortcuts);
        return () => window.removeEventListener("keydown", handleShortcuts);
    }, [redoDesign, undoDesign]);

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

    const changePreviewDraft = useCallback((draft: boolean) => {
        setPreviewDraft(draft);
        if (!draft) {
            setSelectingElements(false);
            setSelectedElements([]);
        }
    }, []);

    const changeScope = useCallback(
        (path: string) => {
            const current = designRef.current;
            const nextTokens = resolveScopeTokens(current, path);

            selectedPageRef.current = path;
            setSelectedPageState(path);
            setSelectedElements([]);
            selectedElementsRef.current = [];
            setSelectingElements(false);
            setActivePresetId(findPresetIdForTokens(nextTokens, customPresetsRef.current));

            if (path !== "__global__") {
                previewPageRef.current = path;
                setPreviewPageState(path);
            }
        },
        [],
    );

    const changePreviewPage = useCallback(
        (path: string) => {
            previewPageRef.current = path;
            setPreviewPageState(path);
            setSelectedElements([]);
            selectedElementsRef.current = [];
            setSelectingElements(false);

            if (selectedPageRef.current !== "__global__") {
                selectedPageRef.current = path;
                setSelectedPageState(path);
                setActivePresetId(
                    findPresetIdForTokens(
                        resolveScopeTokens(designRef.current, path),
                        customPresetsRef.current,
                    ),
                );
            }
        },
        [],
    );

    const changePreviewWidth = useCallback((width: number) => {
        previewWidthRef.current = width;
        setPreviewWidthState(width);
        setSelectedElements([]);
        selectedElementsRef.current = [];
        setSelectingElements(false);
    }, []);

    const refreshPreview = useCallback(() => {
        setPreviewReloadKey((current) => current + 1);
        setSelectingElements(false);
        setSelectedElements([]);
        selectedElementsRef.current = [];
    }, []);

    const startSelecting = useCallback(() => {
        if (!previewDraftRef.current) return;
        setSelectingElements(true);
    }, []);

    const stopSelecting = useCallback(() => {
        setSelectingElements(false);
        setSelectedElements([]);
        selectedElementsRef.current = [];
    }, []);

    const toggleSelecting = useCallback(() => {
        if (selectingElementsRef.current) {
            stopSelecting();
        } else {
            startSelecting();
        }
    }, [startSelecting, stopSelecting]);

    useEffect(() => {
        function clearSelectionOnEscape(event: KeyboardEvent) {
            if (event.key !== "Escape" || document.querySelector("dialog[open]")) {
                return;
            }

            const target = event.target;
            if (
                target instanceof HTMLElement &&
                (target.isContentEditable ||
                    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
            ) {
                return;
            }

            if (selectingElementsRef.current) {
                stopSelecting();
            }
        }

        window.addEventListener("keydown", clearSelectionOnEscape);
        return () => window.removeEventListener("keydown", clearSelectionOnEscape);
    }, [stopSelecting]);

    const resetTokenSection = useCallback(
        (keys: Array<keyof DesignTokens>) => {
            const current = designRef.current;
            if (selectedPageRef.current === "__global__") {
                commitDesign({
                    ...current,
                    global: {
                        ...current.global,
                        ...Object.fromEntries(keys.map((key) => [key, defaultDesignTokens[key]])),
                    },
                });
            } else {
                const page = { ...current.pages[selectedPageRef.current] };
                for (const key of keys) delete page[key];
                commitDesign({
                    ...current,
                    pages: { ...current.pages, [selectedPageRef.current]: page },
                });
            }
            setActivePresetId("");
            notify("info", "This design section now uses its inherited defaults.");
        },
        [commitDesign, notify],
    );

    const resetGalleryContent = useCallback(
        (keys: Array<keyof GalleryContent>) => {
            const current = designRef.current;
            const page = current.pages["/gallery"] ?? {};
            const galleryContent = { ...page.galleryContent };
            for (const key of keys) delete galleryContent[key];
            commitDesign({
                ...current,
                pages: { ...current.pages, "/gallery": { ...page, galleryContent } },
            });
            notify("info", "These gallery settings now use their defaults.");
        },
        [commitDesign, notify],
    );

    const restoreSavedDesign = useCallback(() => {
        commitDesign(savedDesignRef.current);
        const emptyHistory = { past: [], future: [] };
        historyRef.current = emptyHistory;
        setHistory(emptyHistory);
        setActivePresetId(
            findPresetIdForTokens(
                resolveScopeTokens(savedDesignRef.current, selectedPageRef.current),
                customPresetsRef.current,
            ),
        );
        notify("info", "Unsaved changes were reverted to the last published design.");
    }, [commitDesign, notify]);

    const resetCurrentScope = useCallback(() => {
        const current = designRef.current;
        const saved = savedDesignRef.current;

        if (selectedPageRef.current === "__global__") {
            commitDesign({ ...current, global: saved.global });
            setActivePresetId(findPresetIdForTokens(saved.global, customPresetsRef.current));
            notify("info", "Site-wide settings were restored to their last published values.");
            return;
        }

        const pages = { ...current.pages };
        if (saved.pages[selectedPageRef.current]) {
            pages[selectedPageRef.current] = saved.pages[selectedPageRef.current];
        } else {
            delete pages[selectedPageRef.current];
        }

        commitDesign({ ...current, pages });
        setActivePresetId("");
        notify("info", "This page was restored to its last published settings.");
    }, [commitDesign, notify]);

    const resetEverything = useCallback(() => {
        commitDesign({ global: defaultDesignTokens, pages: {} });
        selectedPageRef.current = "__global__";
        setSelectedPageState("__global__");
        setSelectedElements([]);
        selectedElementsRef.current = [];
        setSelectingElements(false);
        setActivePresetId("");
        notify("info", "The design is reset to defaults. Publish when you are ready.");
    }, [commitDesign, notify]);

    const changePageElements = useCallback(
        (route: string, updater: (page: PageDesignOverrides) => PageDesignOverrides) => {
            const current = designRef.current;
            const page = current.pages[route] ?? {};
            return { ...current, pages: { ...current.pages, [route]: updater(page) } };
        },
        [],
    );

    const handleElementsSelected = useCallback(
        (selections: DesignPreviewSelection[], positionsChanged: boolean) => {
            selectedElementsRef.current = selections;
            setSelectedElements(selections);
            const route = previewPageRef.current;

            if (selectedPageRef.current !== route) {
                selectedPageRef.current = route;
                setSelectedPageState(route);
            }

            if (!positionsChanged || selections.length === 0) {
                return;
            }

            const breakpoint = elementBreakpointForWidth(previewWidthRef.current);
            const page = designRef.current.pages[route] ?? {};
            const baseSizes = page.elementSizes ?? {};
            const responsiveSizes =
                breakpoint === "desktop" ? {} : page.responsiveElementSizes?.[breakpoint] ?? {};
            const elementSizes = { ...getElementSizesForBreakpoint(page, breakpoint) };
            let positionChanged = false;

            for (const selection of selections) {
                const current = {
                    ...baseSizes[selection.locator],
                    ...responsiveSizes[selection.locator],
                };
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
                    ...designRef.current,
                    pages: {
                        ...designRef.current.pages,
                        [route]: updateElementSizesForBreakpoint(page, breakpoint, elementSizes),
                    },
                });
                setActivePresetId("");
            }
        },
        [commitDesign],
    );

    const applyPositionDeltas = useCallback(
        (deltas: Array<{ locator: string; x: number; y: number }>) => {
            const elements = selectedElementsRef.current;
            if (elements.length === 0 || deltas.length === 0) {
                return;
            }

            const route = previewPageRef.current;
            const breakpoint = elementBreakpointForWidth(previewWidthRef.current);
            const page = designRef.current.pages[route] ?? {};
            const elementSizes = { ...getElementSizesForBreakpoint(page, breakpoint) };
            const deltaByLocator = new Map(
                deltas.map((delta) => [
                    delta.locator,
                    {
                        x: Math.max(
                            elementPositionBounds.min,
                            Math.min(elementPositionBounds.max, delta.x),
                        ),
                        y: Math.max(
                            elementPositionBounds.min,
                            Math.min(elementPositionBounds.max, delta.y),
                        ),
                    },
                ]),
            );

            for (const element of elements) {
                const delta = deltaByLocator.get(element.locator);
                if (!delta) continue;
                elementSizes[element.locator] = {
                    ...elementSizes[element.locator],
                    x: delta.x,
                    y: delta.y,
                };
            }

            commitDesign({
                ...designRef.current,
                pages: {
                    ...designRef.current.pages,
                    [route]: updateElementSizesForBreakpoint(page, breakpoint, elementSizes),
                },
            });
            setSelectedElements((current) =>
                current.map((element) => {
                    const delta = deltaByLocator.get(element.locator);
                    if (!delta) return element;
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
        },
        [commitDesign],
    );

    const updateGalleryContent = useCallback(
        <Key extends keyof GalleryContent>(key: Key, value: GalleryContent[Key]) => {
            const current = designRef.current;
            const page = current.pages["/gallery"] ?? {};
            const nextGalleryContent: Partial<GalleryContent> = { ...page.galleryContent };
            nextGalleryContent[key] = value;
            commitDesign({
                ...current,
                pages: {
                    ...current.pages,
                    "/gallery": { ...page, galleryContent: nextGalleryContent },
                },
            });
            setActivePresetId("");
        },
        [commitDesign],
    );

    const alignSelection = useCallback(
        function alignSelection(axis: "horizontal" | "vertical", edge: "start" | "center" | "end") {
        const elements = selectedElementsRef.current;
        if (elements.length === 0) return;

        const isHorizontal = axis === "horizontal";
        const startKey = isHorizontal ? "left" : "top";
        const sizeKey = isHorizontal ? "width" : "height";
        const parentStartKey = isHorizontal ? "parentLeft" : "parentTop";
        const parentSizeKey = isHorizontal ? "parentWidth" : "parentHeight";
        const first = elements[0];

        if (elements.length === 1) {
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
            applyPositionDeltas([
                {
                    locator: first.locator,
                    x: first.x + (isHorizontal ? delta : 0),
                    y: first.y + (isHorizontal ? 0 : delta),
                },
            ]);
            return;
        }

        const starts = elements.map((element) => element[startKey]);
        const ends = elements.map((element) => element[startKey] + element[sizeKey]);
        const groupStart = Math.min(...starts);
        const groupEnd = Math.max(...ends);
        const target =
            edge === "start" ? groupStart : edge === "center" ? (groupStart + groupEnd) / 2 : groupEnd;

        applyPositionDeltas(
            elements.map((element) => {
                const elementStart = element[startKey];
                const elementSize = element[sizeKey];
                const targetStart =
                    edge === "start"
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
            }),
        );
        },
        [applyPositionDeltas],
    );

    const centerSelectionInPage = useCallback(
        function centerSelectionInPage(axis: "horizontal" | "vertical") {
        const elements = selectedElementsRef.current;
        if (elements.length === 0) return;

        const isHorizontal = axis === "horizontal";
        const startKey = isHorizontal ? "left" : "top";
        const sizeKey = isHorizontal ? "width" : "height";
        const first = elements[0];
        const containerStart =
            elements.length === 1
                ? isHorizontal
                    ? first.parentLeft
                    : first.parentTop
                : isHorizontal
                  ? first.pageLeft
                  : first.pageTop;
        const containerSize =
            elements.length === 1
                ? isHorizontal
                    ? first.parentWidth
                    : first.parentHeight
                : isHorizontal
                  ? first.pageWidth
                  : first.pageHeight;
        const starts = elements.map((element) => element[startKey]);
        const ends = elements.map((element) => element[startKey] + element[sizeKey]);
        const groupStart = Math.min(...starts);
        const groupEnd = Math.max(...ends);
        const delta = Math.round(
            containerStart + (containerSize - (groupEnd - groupStart)) / 2 - groupStart,
        );

        applyPositionDeltas(
            elements.map((element) => ({
                locator: element.locator,
                x: element.x + (isHorizontal ? delta : 0),
                y: element.y + (isHorizontal ? 0 : delta),
            })),
        );
        },
        [applyPositionDeltas],
    );

    const distributeSelection = useCallback(
        function distributeSelection(axis: "horizontal" | "vertical") {
        const elements = selectedElementsRef.current;
        if (elements.length < 3) return;

        const isHorizontal = axis === "horizontal";
        const startKey = isHorizontal ? "left" : "top";
        const sizeKey = isHorizontal ? "width" : "height";
        const ordered = [...elements].sort((left, right) => left[startKey] - right[startKey]);
        const first = ordered[0];
        const last = ordered[ordered.length - 1];
        const totalSize = ordered.reduce((total, element) => total + element[sizeKey], 0);
        const gap =
            (last[startKey] + last[sizeKey] - first[startKey] - totalSize) / (ordered.length - 1);
        let nextStart = first[startKey];

        applyPositionDeltas(
            ordered.map((element) => {
                const delta = Math.round(nextStart - element[startKey]);
                nextStart += element[sizeKey] + gap;
                return {
                    locator: element.locator,
                    x: element.x + (isHorizontal ? delta : 0),
                    y: element.y + (isHorizontal ? 0 : delta),
                };
            }),
        );
        },
        [applyPositionDeltas],
    );

    const resetSelectedPositions = useCallback(() => {
        const elements = selectedElementsRef.current;
        if (!elements.some((element) => element.x !== 0 || element.y !== 0)) return;
        applyPositionDeltas(elements.map((element) => ({ locator: element.locator, x: 0, y: 0 })));
    }, [applyPositionDeltas]);

    const updateSelectedElementSize = useCallback(
        function updateSelectedElementSize<Key extends keyof DesignElementSize>(
            property: Key,
            value: DesignElementSize[Key] | undefined,
        ) {
        const elements = selectedElementsRef.current;
        if (elements.length === 0) return;

        const route = previewPageRef.current;
        const breakpoint = elementBreakpointForWidth(previewWidthRef.current);
        const page = designRef.current.pages[route] ?? {};
        const elementSizes = { ...getElementSizesForBreakpoint(page, breakpoint) };

        for (const element of elements) {
            const nextElementSize = { ...elementSizes[element.locator] };
            if (value === undefined) {
                delete nextElementSize[property];
            } else {
                nextElementSize[property] = value;
            }
            elementSizes[element.locator] = nextElementSize;
        }

        commitDesign({
            ...designRef.current,
            pages: {
                ...designRef.current.pages,
                [route]: updateElementSizesForBreakpoint(page, breakpoint, elementSizes),
            },
        });
        setSelectedElements((current) =>
            current.map((element) => {
                if (
                    !elements.some((selected) => selected.locator === element.locator) ||
                    value === undefined
                ) {
                    return element;
                }
                if (property === "width" && typeof value === "number") {
                    return { ...element, width: value };
                }
                if (property === "height" && typeof value === "number") {
                    return { ...element, height: value };
                }
                if (property === "fontSize" && typeof value === "number") {
                    return { ...element, fontSize: value };
                }
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
        },
        [commitDesign],
    );

    const resetSelectedElementSize = useCallback(() => {
        const elements = selectedElementsRef.current;
        if (elements.length === 0) return;

        const route = previewPageRef.current;
        const breakpoint = elementBreakpointForWidth(previewWidthRef.current);
        const page = designRef.current.pages[route];
        if (!page || Object.keys(getElementSizesForBreakpoint(page, breakpoint)).length === 0) {
            return;
        }

        const elementSizes = { ...getElementSizesForBreakpoint(page, breakpoint) };
        let changed = false;
        for (const element of elements) {
            if (elementSizes[element.locator]) {
                delete elementSizes[element.locator];
                changed = true;
            }
        }
        if (!changed) return;

        commitDesign({
            ...designRef.current,
            pages: {
                ...designRef.current.pages,
                [route]: updateElementSizesForBreakpoint(page, breakpoint, elementSizes),
            },
        });
        setActivePresetId("");
        notify("info", "Selected elements now use their original sizes and positions.");
    }, [commitDesign, notify]);

    const deleteSelectedElement = useCallback(() => {
        const elements = selectedElementsRef.current;
        if (elements.length === 0) return;

        const route = previewPageRef.current;
        const page = designRef.current.pages[route] ?? {};
        const selectedLocators = elements.map((element) => element.locator);
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
        commitDesign(changePageElements(route, (currentPage) => ({
            ...currentPage,
            elementSizes,
            responsiveElementSizes,
            hiddenElements,
        })));
        setSelectedElements([]);
        selectedElementsRef.current = [];
        setSelectingElements(false);
        notify(
            "info",
            `${selectedLocators.length} selected element${selectedLocators.length === 1 ? "" : "s"} removed from this page. Restore them from Tools or undo this change.`,
        );
    }, [changePageElements, commitDesign, notify]);

    const restoreElement = useCallback((locator: string) => {
        const route = previewPageRef.current;
        const page = designRef.current.pages[route];
        if (!page?.hiddenElements?.includes(locator)) return;

        const hiddenElements = page.hiddenElements.filter((hiddenLocator) => hiddenLocator !== locator);
        commitDesign(
            changePageElements(route, (currentPage) => ({
                ...currentPage,
                hiddenElements,
            })),
        );
        notify("success", "Element restored to this page.");
    }, [changePageElements, commitDesign, notify]);

    const copyCurrentDesign = useCallback(async () => {
        try {
            const scopedTokens = resolveScopeTokens(designRef.current, selectedPageRef.current);
            await navigator.clipboard.writeText(JSON.stringify(scopedTokens, null, 2));
            notify("success", "Current design copied. Select another page and paste it there.");
        } catch (cause) {
            notify(
                "error",
                cause instanceof Error
                    ? `Could not access the clipboard: ${cause.message}`
                    : "Could not access the clipboard.",
            );
        }
    }, [notify]);

    const pasteCurrentDesign = useCallback(async () => {
        try {
            const text = await navigator.clipboard.readText();
            const parsedJson: unknown = JSON.parse(text);
            const parsed = designTokensSchema.safeParse(parsedJson);

            if (!parsed.success) {
                notify("error", "Clipboard content is not a valid Photo Maker design preset.");
                return;
            }

            const current = designRef.current;
            const scope = selectedPageRef.current;
            const next =
                scope === "__global__"
                    ? { ...current, global: parsed.data }
                    : {
                          ...current,
                          pages: {
                              ...current.pages,
                              [scope]: { ...current.pages[scope], ...parsed.data },
                          },
                      };
            commitDesign(next);
            setActivePresetId("");
            notify("success", "Design settings pasted into the selected scope.");
        } catch (cause) {
            notify(
                "error",
                cause instanceof Error
                    ? cause.message
                    : "Could not read a valid design from the clipboard.",
            );
        }
    }, [commitDesign, notify]);

    const updateToken = useCallback(
        function updateToken<Key extends keyof DesignTokens>(key: Key, value: DesignTokens[Key]) {
            const current = designRef.current;
            const scope = selectedPageRef.current;
            const next =
                scope === "__global__"
                    ? { ...current, global: { ...current.global, [key]: value } }
                    : {
                          ...current,
                          pages: {
                              ...current.pages,
                              [scope]: { ...current.pages[scope], [key]: value },
                          },
                      };
            commitDesign(next);
            setActivePresetId("");
        },
        [commitDesign],
    );

    const selectPreset = useCallback(
        (id: string) => {
            const preset =
                builtInLayoutPresets.find((candidate) => candidate.id === id) ??
                customPresetsRef.current.find((candidate) => candidate.id === id);
            if (!preset) return;

            const current = designRef.current;
            const scope = selectedPageRef.current;
            const next =
                scope === "__global__"
                    ? { ...current, global: preset.tokens }
                    : {
                          ...current,
                          pages: {
                              ...current.pages,
                              [scope]: { ...current.pages[scope], ...preset.tokens },
                          },
                      };
            commitDesign(next);
            setActivePresetId(id);
        },
        [commitDesign],
    );

    const addPageProfile = useCallback((rawPath: string): { ok: boolean; error?: string } => {
        const path = rawPath.trim();
        if (path === STUDIO_ROUTE) {
            const error = "The design studio route cannot have its own page profile.";
            notify("error", error);
            return { ok: false, error };
        }

        if (!pageKeySchema.safeParse(path).success) {
            const error =
                "Enter a route path that starts with / and does not include a query, hash, or traversal segments.";
            notify("error", error);
            return { ok: false, error };
        }

        const current = designRef.current;
        const alreadyExists = Object.prototype.hasOwnProperty.call(current.pages, path);
        if (!alreadyExists) {
            commitDesign({ ...current, pages: { ...current.pages, [path]: {} } });
        }

        selectedPageRef.current = path;
        setSelectedPageState(path);
        previewPageRef.current = path;
        setPreviewPageState(path);
        setSelectedElements([]);
        selectedElementsRef.current = [];
        setSelectingElements(false);
        setActivePresetId("");
        notify(
            "success",
            alreadyExists
                ? "That route profile is ready to edit."
                : "New page profile added. It inherits the site design until you change its settings.",
        );
        return { ok: true };
    }, [commitDesign, notify]);

    const resetPageProfile = useCallback(() => {
        const scope = selectedPageRef.current;
        if (scope === "__global__") return;

        const pages = { ...designRef.current.pages };
        delete pages[scope];
        commitDesign({ ...designRef.current, pages });
        setActivePresetId("");
        notify("info", "This page now inherits every setting from the site design.");
    }, [commitDesign, notify]);

    const saveDesign = useCallback(async () => {
        if (pendingRef.current) return;
        const snapshot = designRef.current;
        if (JSON.stringify(snapshot) === JSON.stringify(savedDesignRef.current)) {
            return;
        }

        pendingRef.current = "design";
        setPendingAction("design");
        setSaveError(null);
        setNotice(null);

        try {
            const response = await fetch("/api/design/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(snapshot),
            });
            const result: unknown = await response.json();

            if (!response.ok) {
                const error = responseError(result, "The design settings could not be saved.");
                setSaveError(error);
                notify("error", error);
                return;
            }

            savedDesignRef.current = snapshot;
            setSavedDesign(snapshot);
            setPreviewDraft(true);
            const emptyHistory = { past: [], future: [] };
            historyRef.current = emptyHistory;
            setHistory(emptyHistory);
            lastCommitAtRef.current = 0;
            notify("success", "Design settings saved and applied to the live site.");
        } catch (cause) {
            const message =
                cause instanceof Error
                    ? cause.message
                    : "The design settings could not be saved.";
            setSaveError(message);
            notify("error", message);
        } finally {
            pendingRef.current = null;
            setPendingAction(null);
        }
    }, [notify]);

    const savePreset = useCallback(async (name: string): Promise<boolean> => {
        if (pendingRef.current) return false;
        const trimmedName = name.trim();
        if (!trimmedName) {
            notify("error", "Give this preset a name before saving it.");
            return false;
        }

        pendingRef.current = "preset";
        setPendingAction("preset");
        setNotice(null);
        const scopedTokens = resolveScopeTokens(designRef.current, selectedPageRef.current);

        try {
            const response = await fetch("/api/design/presets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: trimmedName, tokens: scopedTokens }),
            });
            const result: unknown = await response.json();

            if (!response.ok) {
                notify("error", responseError(result, "The preset could not be saved."));
                return false;
            }

            const parsed = savedPresetResponseSchema.safeParse(result);
            if (!parsed.success) {
                throw new Error("The server returned an invalid design preset.");
            }

            setCustomPresets((current) =>
                [...current, parsed.data.preset].sort((left, right) =>
                    left.name.localeCompare(right.name),
                ),
            );
            setActivePresetId(parsed.data.preset.id);
            notify("success", `“${parsed.data.preset.name}” is now available in your saved presets.`);
            return true;
        } catch (cause) {
            notify(
                "error",
                cause instanceof Error ? cause.message : "The preset could not be saved.",
            );
            return false;
        } finally {
            pendingRef.current = null;
            setPendingAction(null);
        }
    }, [notify]);

    const deletePreset = useCallback(async (id: string): Promise<boolean> => {
        if (pendingRef.current) return false;
        const preset = customPresetsRef.current.find((candidate) => candidate.id === id);
        if (!preset) return false;

        pendingRef.current = "delete-preset";
        setPendingAction("delete-preset");
        setNotice(null);

        try {
            const response = await fetch(`/api/design/presets/${encodeURIComponent(id)}`, {
                method: "DELETE",
            });
            const result: unknown = await response.json();

            if (!response.ok) {
                notify("error", responseError(result, "The preset could not be deleted."));
                return false;
            }

            setCustomPresets((current) => current.filter((candidate) => candidate.id !== id));
            setActivePresetId((current) => (current === id ? "" : current));
            notify("success", `“${preset.name}” was deleted. Your current design was not changed.`);
            return true;
        } catch (cause) {
            notify(
                "error",
                cause instanceof Error ? cause.message : "The preset could not be deleted.",
            );
            return false;
        } finally {
            pendingRef.current = null;
            setPendingAction(null);
        }
    }, [notify]);

    return {
        design,
        savedDesign,
        customPresets,
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
        previewBaseElementSizes,
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
        isScopeDirty,
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
        startSelecting,
        stopSelecting,
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
        notify,
    };
}
