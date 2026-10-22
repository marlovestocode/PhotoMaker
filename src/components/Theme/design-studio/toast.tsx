"use client";

import { useEffect, useRef } from "react";
import type { StudioNotice } from "./types";
import { StudioIcon } from "./icons";
import { cx } from "./controls";

export function StudioToast({
    notice,
    onDismiss,
}: {
    notice: StudioNotice | null;
    onDismiss: () => void;
}) {
    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const element = popoverRef.current;
        if (!element) return;

        if (notice && !element.matches(":popover-open")) {
            element.showPopover();
        } else if (!notice && element.matches(":popover-open")) {
            element.hidePopover();
        }
    }, [notice]);

    useEffect(() => {
        if (!notice) return;
        const timeout = window.setTimeout(onDismiss, notice.tone === "error" ? 9000 : 6000);
        return () => window.clearTimeout(timeout);
    }, [notice, onDismiss]);

    return (
        <div
            aria-live={notice?.tone === "error" ? "assertive" : "polite"}
            className={cx("studio-toast", notice && `studio-toast--${notice.tone}`)}
            popover="manual"
            ref={popoverRef}
            role={notice?.tone === "error" ? "alert" : "status"}
        >
            {notice && (
                <>
                    <span aria-hidden="true" className="studio-toast__icon">
                        <StudioIcon
                            name={notice.tone === "error" ? "warning" : notice.tone === "info" ? "info" : "check"}
                            size={17}
                        />
                    </span>
                    <p className="studio-toast__message">{notice.message}</p>
                    <button
                        aria-label="Dismiss notification"
                        className="studio-toast__close"
                        onClick={onDismiss}
                        type="button"
                    >
                        <StudioIcon name="close" size={14} />
                    </button>
                </>
            )}
        </div>
    );
}
