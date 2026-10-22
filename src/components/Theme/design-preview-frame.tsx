"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
    designPreviewControlMessageSchema,
    designPreviewSelectionSchema,
    type DesignElementSizes,
    type DesignPreviewSelection,
    type DesignTokens,
    type GalleryContent,
    type ResponsiveElementSizes,
} from "@/theme/design-system";

export function DesignPreviewFrame({
    path,
    tokens,
    elementSizes,
    responsiveElementSizes,
    hiddenElements,
    galleryContent,
    selecting,
    onElementsSelected,
    viewportWidth,
    reloadKey,
    previewHeight = 780,
}: {
    path: string;
    tokens: DesignTokens;
    elementSizes: DesignElementSizes;
    responsiveElementSizes: ResponsiveElementSizes;
    hiddenElements: string[];
    galleryContent: GalleryContent;
    selecting: boolean;
    onElementsSelected: (selections: DesignPreviewSelection[], positionsChanged: boolean) => void;
    viewportWidth: number;
    reloadKey: number;
    previewHeight?: number;
}) {
    const frameRef = useRef<HTMLIFrameElement>(null);
    const previewRef = useRef<HTMLDivElement>(null);
    const [availableWidth, setAvailableWidth] = useState(0);
    const scale = Math.min(1, availableWidth / viewportWidth);
    const previewUrl = `${path}${path.includes("?") ? "&" : "?"}designPreview=1`;

    const sendPreviewSettings = useCallback(() => {
        const frameWindow = frameRef.current?.contentWindow;
        const message = designPreviewControlMessageSchema.safeParse({
            type: "photomaker:design-preview",
            tokens,
            elementSizes,
            responsiveElementSizes,
            hiddenElements,
            galleryContent,
            selecting,
        });

        if (frameWindow && message.success) {
            frameWindow.postMessage(message.data, window.location.origin);
        }
    }, [elementSizes, galleryContent, hiddenElements, responsiveElementSizes, selecting, tokens]);

    useEffect(() => {
        const element = previewRef.current;

        if (!element) {
            return;
        }

        const observer = new ResizeObserver(([entry]) => {
            setAvailableWidth(entry.contentRect.width);
        });

        observer.observe(element);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        sendPreviewSettings();
    }, [path, reloadKey, sendPreviewSettings, viewportWidth]);

    useEffect(() => {
        function receiveSelection(event: MessageEvent<unknown>) {
            if (event.origin !== window.location.origin || event.source !== frameRef.current?.contentWindow) {
                return;
            }

            if (
                typeof event.data === "object" &&
                event.data !== null &&
                "type" in event.data &&
                event.data.type === "photomaker:design-preview-ready"
            ) {
                sendPreviewSettings();
                return;
            }

            const selection = designPreviewSelectionSchema.safeParse(event.data);
            if (selection.success) {
                onElementsSelected(selection.data.selections, selection.data.positionsChanged);
            }
        }

        window.addEventListener("message", receiveSelection);
        return () => window.removeEventListener("message", receiveSelection);
    }, [onElementsSelected, sendPreviewSettings]);

    return (
        <div
            className="design-preview-frame-shell mx-auto overflow-hidden rounded-xl border border-stone-300 bg-white"
            ref={previewRef}
            style={{ height: Math.max(0, previewHeight * scale), width: "100%" }}
        >
            {scale > 0 && (
                <iframe
                    className="block border-0 bg-white"
                    key={`${previewUrl}:${reloadKey}`}
                    onLoad={sendPreviewSettings}
                    ref={frameRef}
                    src={previewUrl}
                    style={{
                        height: previewHeight,
                        left: "50%",
                        position: "relative",
                        transform: `translateX(-50%) scale(${scale})`,
                        transformOrigin: "top center",
                        width: viewportWidth,
                    }}
                    title={`Live page preview: ${path}`}
                />
            )}
        </div>
    );
}
