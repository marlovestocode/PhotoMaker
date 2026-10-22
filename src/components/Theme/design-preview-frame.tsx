"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import {
    designPreviewControlMessageSchema,
    designPreviewSelectionSchema,
    type DesignElementSizes,
    type DesignPreviewSelection,
    type DesignTokens,
    type GalleryContent,
    type ResponsiveElementSizes,
} from "@/theme/design-system";

export const DesignPreviewFrame = memo(function DesignPreviewFrame({
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
    const [loaded, setLoaded] = useState(false);
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
        setLoaded(false);
    }, [previewUrl, reloadKey]);

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
            aria-busy={!loaded}
            className="design-preview-frame-shell studio-preview-shell"
            ref={previewRef}
            style={{ height: Math.max(0, previewHeight * scale), width: "100%" }}
        >
            {scale > 0 && (
                <iframe
                    className="studio-preview-frame"
                    key={`${previewUrl}:${reloadKey}`}
                    onLoad={() => {
                        setLoaded(true);
                        sendPreviewSettings();
                    }}
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
            {!loaded && (
                <div aria-live="polite" className="studio-preview-loading" role="status">
                    <span aria-hidden="true" className="studio-preview-loading__spinner" />
                    Rendering preview
                </div>
            )}
        </div>
    );
});
