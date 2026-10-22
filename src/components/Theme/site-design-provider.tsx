"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
    elementPositionBounds,
    designElementOverridesToCss,
    designPreviewControlMessageSchema,
    designTokensToCss,
    defaultGalleryContent,
    relativeLuminance,
    resolvePageDesignOverrides,
    resolveDesignTokens,
    type DesignElementSizes,
    type GalleryContent,
    type DesignTokens,
    type ResponsiveElementSizes,
    type SiteDesign,
} from "@/theme/design-system";

const GalleryContentContext = createContext<GalleryContent>(defaultGalleryContent);

export function useGalleryContent() {
    return useContext(GalleryContentContext);
}

export function SiteDesignProvider({ children, design }: { children: ReactNode; design: SiteDesign }) {
    const pathname = usePathname() || "/";
    const [previewTokens, setPreviewTokens] = useState<DesignTokens | null>(null);
    const [previewElementSizes, setPreviewElementSizes] = useState<DesignElementSizes | null>(null);
    const [previewResponsiveElementSizes, setPreviewResponsiveElementSizes] = useState<ResponsiveElementSizes | null>(null);
    const [previewHiddenElements, setPreviewHiddenElements] = useState<string[] | null>(null);
    const [previewGalleryContent, setPreviewGalleryContent] = useState<GalleryContent | null>(null);
    const [previewSelecting, setPreviewSelecting] = useState(false);
    const tokens = previewTokens ?? resolveDesignTokens(design, pathname);
    const pageOverrides = resolvePageDesignOverrides(design, pathname);
    const galleryContent = previewGalleryContent ?? {
        ...defaultGalleryContent,
        ...pageOverrides?.galleryContent,
    };
    const elementSizes = previewElementSizes ?? pageOverrides?.elementSizes ?? {};
    const responsiveElementSizes = previewResponsiveElementSizes ?? pageOverrides?.responsiveElementSizes ?? {};
    const hiddenElements = previewHiddenElements ?? pageOverrides?.hiddenElements ?? [];
    const isDesignStudio = pathname === "/settings/design";

    useEffect(() => {
        document.body.style.backgroundColor = tokens.background;
        document.body.style.color = tokens.text;
        document.documentElement.style.colorScheme =
            relativeLuminance(tokens.background) < 0.5 ? "dark" : "light";
    }, [tokens.background, tokens.text]);

    useEffect(() => {
        if (window.parent === window) {
            return;
        }

        function receivePreview(event: MessageEvent<unknown>) {
            if (event.origin !== window.location.origin || event.source !== window.parent) {
                return;
            }

            if (typeof event.data !== "object" || event.data === null || !("type" in event.data) || event.data.type !== "photomaker:design-preview") {
                return;
            }

            const parsed = designPreviewControlMessageSchema.safeParse(event.data);
            if (parsed.success) {
                setPreviewTokens(parsed.data.tokens);
                setPreviewElementSizes(parsed.data.elementSizes);
                setPreviewResponsiveElementSizes(parsed.data.responsiveElementSizes);
                setPreviewHiddenElements(parsed.data.hiddenElements);
                setPreviewGalleryContent(parsed.data.galleryContent);
                setPreviewSelecting(parsed.data.selecting);
            }
        }

        window.addEventListener("message", receivePreview);
        window.parent.postMessage(
            { type: "photomaker:design-preview-ready" },
            window.location.origin,
        );
        return () => window.removeEventListener("message", receivePreview);
    }, []);

    useEffect(() => {
        const rootElement = document.querySelector<HTMLElement>(".site-design-shell");

        if (!rootElement) {
            return;
        }

        if (!previewSelecting || window.parent === window) {
            rootElement.removeAttribute("data-design-selecting");
            rootElement.querySelectorAll("[data-design-hovered], [data-design-selected], [data-design-dragging]").forEach((element) => {
                element.removeAttribute("data-design-hovered");
                element.removeAttribute("data-design-selected");
                element.removeAttribute("data-design-dragging");
            });
            return;
        }

        rootElement.setAttribute("data-design-selecting", "true");
        let hovered: HTMLElement | null = null;
        const selected = new Map<string, HTMLElement>();
        let suppressClickTarget: HTMLElement | null = null;
        let suppressClickTimer: ReturnType<typeof setTimeout> | undefined;
        let activeDrag: {
            element: HTMLElement;
            pointerId: number;
            startX: number;
            startY: number;
            selectedElements: Array<{
                element: HTMLElement;
                locator: string;
                originX: number;
                originY: number;
            }>;
            moved: boolean;
        } | null = null;

        function readPosition(element: HTMLElement) {
            const value = getComputedStyle(element).translate;
            const coordinates = value.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
            return {
                x: Math.round(coordinates[0] ?? 0),
                y: Math.round(coordinates[1] ?? 0),
            };
        }

        function describeElement(locator: string, element: HTMLElement) {
            const text = element.getAttribute("alt") ?? element.textContent?.replace(/\s+/g, " ").trim() ?? "";
            const label = (text || element.tagName.toLowerCase()).slice(0, 120);
            const bounds = element.getBoundingClientRect();
            const parentBounds = element.parentElement?.getBoundingClientRect() ?? bounds;
            const pageBounds = rootElement!.getBoundingClientRect();
            const position = readPosition(element);
            const computed = getComputedStyle(element);
            const fontSize = Math.round(Number.parseFloat(computed.fontSize));
            return {
                locator,
                label,
                tag: element.tagName.toLowerCase(),
                width: Math.round(bounds.width),
                height: Math.round(bounds.height),
                fontSize,
                color: colorToHex(computed.color) ?? "#000000",
                backgroundColor: colorToHex(computed.backgroundColor) ?? "#ffffff",
                fontFamily: describeFontFamily(computed.fontFamily),
                fontWeight: describeFontWeight(computed.fontWeight),
                textAlign: ["left", "center", "right", "justify"].includes(computed.textAlign)
                    ? computed.textAlign
                    : "left",
                padding: clamp(Math.round(Number.parseFloat(computed.paddingTop)), 0, 240),
                borderRadius: clamp(Math.round(Number.parseFloat(computed.borderTopLeftRadius)), 0, 240),
                borderColor: colorToHex(computed.borderTopColor) ?? "#000000",
                borderWidth: clamp(Math.round(Number.parseFloat(computed.borderTopWidth)), 0, 24),
                borderStyle: ["none", "solid", "double", "dashed"].includes(computed.borderTopStyle)
                    ? computed.borderTopStyle
                    : "solid",
                letterSpacing: computed.letterSpacing === "normal"
                    ? 0
                    : clamp(Number.parseFloat(computed.letterSpacing), -8, 32),
                lineHeight: computed.lineHeight === "normal" || fontSize === 0
                    ? 1.5
                    : clamp(Number.parseFloat(computed.lineHeight) / fontSize, 0.5, 4),
                opacity: Number.parseFloat(computed.opacity),
                objectFit: ["cover", "contain", "fill", "none", "scale-down"].includes(computed.objectFit)
                    ? computed.objectFit
                    : "cover",
                textTransform: ["none", "uppercase", "lowercase", "capitalize"].includes(computed.textTransform)
                    ? computed.textTransform
                    : "none",
                left: Math.round(bounds.left),
                top: Math.round(bounds.top),
                parentLeft: Math.round(parentBounds.left),
                parentTop: Math.round(parentBounds.top),
                parentWidth: Math.round(parentBounds.width),
                parentHeight: Math.round(parentBounds.height),
                pageLeft: Math.round(pageBounds.left),
                pageTop: Math.round(pageBounds.top),
                pageWidth: Math.round(pageBounds.width),
                pageHeight: Math.round(pageBounds.height),
                ...position,
            };
        }

        function sendSelections(positionsChanged = false) {
            const selections = Array.from(selected.entries()).flatMap(([locator, element]) =>
                rootElement!.contains(element) ? [describeElement(locator, element)] : [],
            );
            window.parent.postMessage(
                { type: "photomaker:design-elements-selected", selections, positionsChanged },
                window.location.origin,
            );
        }

        function setSelected(locator: string, element: HTMLElement, isSelected: boolean) {
            if (isSelected) {
                selected.set(locator, element);
                element.setAttribute("data-design-selected", "true");
            } else {
                selected.delete(locator);
                element.removeAttribute("data-design-selected");
            }
        }

        function onPointerOver(event: PointerEvent) {
            const target = event.target;
            if (!(target instanceof HTMLElement) || target === rootElement || !rootElement!.contains(target)) {
                return;
            }

            hovered?.removeAttribute("data-design-hovered");
            hovered = target;
            hovered.setAttribute("data-design-hovered", "true");
        }

        function onPointerDown(event: PointerEvent) {
            const target = event.target;
            const locator =
                target instanceof HTMLElement
                    ? getDesignElementLocator(rootElement!, target)
                    : null;
            if (
                !(target instanceof HTMLElement) ||
                !locator ||
                !selected.has(locator) ||
                target === rootElement
            ) {
                return;
            }

            const selectedElements = Array.from(selected.entries()).flatMap(([selectedLocator, element]) => {
                const position = readPosition(element);
                return rootElement!.contains(element)
                    ? [{
                        element,
                        locator: selectedLocator,
                        originX: position.x,
                        originY: position.y,
                    }]
                    : [];
            });
            activeDrag = {
                element: target,
                pointerId: event.pointerId,
                startX: event.clientX,
                startY: event.clientY,
                selectedElements,
                moved: false,
            };
            if (suppressClickTimer) {
                clearTimeout(suppressClickTimer);
            }
            for (const selectedElement of selectedElements) {
                selectedElement.element.setAttribute("data-design-dragging", "true");
            }
            target.setPointerCapture(event.pointerId);
            event.preventDefault();
            event.stopPropagation();
        }

        function onPointerMove(event: PointerEvent) {
            if (!activeDrag || event.pointerId !== activeDrag.pointerId) {
                return;
            }

            const deltaX = Math.round(event.clientX - activeDrag.startX);
            const deltaY = Math.round(event.clientY - activeDrag.startY);
            for (const selectedElement of activeDrag.selectedElements) {
                const x = Math.max(elementPositionBounds.min, Math.min(elementPositionBounds.max, selectedElement.originX + deltaX));
                const y = Math.max(elementPositionBounds.min, Math.min(elementPositionBounds.max, selectedElement.originY + deltaY));
                activeDrag.moved ||= x !== selectedElement.originX || y !== selectedElement.originY;
                selectedElement.element.style.setProperty("translate", `${x}px ${y}px`, "important");
            }
            event.preventDefault();
        }

        function onPointerUp(event: PointerEvent) {
            if (!activeDrag || event.pointerId !== activeDrag.pointerId) {
                return;
            }

            const element = activeDrag.element;
            const moved = activeDrag.moved;
            const selectedElements = activeDrag.selectedElements;
            activeDrag = null;
            for (const selectedElement of selectedElements) {
                selectedElement.element.removeAttribute("data-design-dragging");
            }
            if (moved) {
                sendSelections(true);
                for (const selectedElement of selectedElements) {
                    selectedElement.element.style.removeProperty("translate");
                }
                suppressClickTarget = element;
                suppressClickTimer = setTimeout(() => {
                    suppressClickTarget = null;
                    suppressClickTimer = undefined;
                }, 500);
            }
        }

        function onClick(event: MouseEvent) {
            const target = event.target;
            if (!(target instanceof HTMLElement) || target === rootElement || !rootElement!.contains(target)) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();

            if (suppressClickTarget === target) {
                if (suppressClickTimer) {
                    clearTimeout(suppressClickTimer);
                }
                suppressClickTarget = null;
                suppressClickTimer = undefined;
                return;
            }

            const locator = getDesignElementLocator(rootElement!, target);
            if (!locator) {
                return;
            }

            if (event.ctrlKey || event.metaKey) {
                setSelected(locator, target, !selected.has(locator));
            } else {
                for (const [selectedLocator, element] of selected) {
                    if (selectedLocator !== locator) {
                        setSelected(selectedLocator, element, false);
                    }
                }
                setSelected(locator, target, true);
            }
            sendSelections();
        }

        document.addEventListener("pointerover", onPointerOver, true);
        document.addEventListener("pointerdown", onPointerDown, true);
        document.addEventListener("pointermove", onPointerMove, true);
        document.addEventListener("pointerup", onPointerUp, true);
        document.addEventListener("pointercancel", onPointerUp, true);
        document.addEventListener("click", onClick, true);
        return () => {
            document.removeEventListener("pointerover", onPointerOver, true);
            document.removeEventListener("pointerdown", onPointerDown, true);
            document.removeEventListener("pointermove", onPointerMove, true);
            document.removeEventListener("pointerup", onPointerUp, true);
            document.removeEventListener("pointercancel", onPointerUp, true);
            document.removeEventListener("click", onClick, true);
            rootElement.removeAttribute("data-design-selecting");
            hovered?.removeAttribute("data-design-hovered");
            for (const element of selected.values()) {
                element.removeAttribute("data-design-selected");
            }
            activeDrag?.element.removeAttribute("data-design-dragging");
            if (suppressClickTimer) {
                clearTimeout(suppressClickTimer);
            }
        };
    }, [previewSelecting]);

    return (
        <div
            className="site-design-shell min-h-full"
            data-layout={tokens.layout}
            data-upload-content-width={pathname === "/upload" ? tokens.uploadContentWidth : undefined}
            style={designTokensToCss(tokens)}
        >
            <GalleryContentContext.Provider value={galleryContent}>
                {!isDesignStudio && (
                    <style data-design-element-overrides>
                        {designElementOverridesToCss(elementSizes, hiddenElements, responsiveElementSizes)}
                    </style>
                )}
                {children}
            </GalleryContentContext.Provider>
        </div>
    );
}

function colorToHex(color: string): string | null {
    const channels = color.match(/[\d.]+/g)?.map(Number);
    if (!channels || channels.length < 3 || (channels.length > 3 && channels[3] === 0)) return null;
    return `#${channels.slice(0, 3).map((channel) => Math.round(channel).toString(16).padStart(2, "0")).join("")}`;
}

function clamp(value: number, minimum: number, maximum: number) {
    return Number.isFinite(value) ? Math.max(minimum, Math.min(maximum, value)) : minimum;
}

function describeFontFamily(fontFamily: string): "serif" | "sans" | "display" | "monospace" {
    const family = fontFamily.toLowerCase();
    if (family.includes("mono")) return "monospace";
    if (family.includes("trebuchet") || family.includes("impact") || family.includes("display")) return "display";
    if (family.includes("sans")) return "sans";
    return "serif";
}

function describeFontWeight(fontWeight: string): "normal" | "500" | "600" | "700" {
    const weight = Number(fontWeight);
    if (weight >= 650) return "700";
    if (weight >= 550) return "600";
    if (weight >= 450) return "500";
    return "normal";
}

function getDesignElementLocator(root: HTMLElement, element: HTMLElement): string | null {
    const segments: string[] = [];
    let current: HTMLElement | null = element;

    while (current && current !== root) {
        const parent: HTMLElement | null = current.parentElement;
        if (!parent) {
            return null;
        }

        const tag = current.tagName.toLowerCase();
        const index = Array.from(parent.children)
            .filter((child) => child.tagName.toLowerCase() === tag)
            .indexOf(current);
        if (index < 0) {
            return null;
        }

        segments.push(`${tag}:${index}`);
        current = parent;
    }

    return current === root ? segments.reverse().join("/") : null;
}
