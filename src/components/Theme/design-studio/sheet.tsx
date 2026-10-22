"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { cx, IconButton } from "./controls";

function useNativeDialog(open: boolean, onClose: () => void) {
    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        if (open && !dialog.open) {
            dialog.showModal();
        } else if (!open && dialog.open) {
            dialog.close();
        }
    }, [open]);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        const handleClose = () => onClose();
        dialog.addEventListener("close", handleClose);
        return () => dialog.removeEventListener("close", handleClose);
    }, [onClose]);

    return dialogRef;
}

export function StudioSheet({
    open,
    onClose,
    title,
    eyebrow,
    description,
    children,
    footer,
    className,
    bodyClassName,
    hideHeader = false,
}: {
    open: boolean;
    onClose: () => void;
    title: string;
    eyebrow?: string;
    description?: string;
    children: ReactNode;
    footer?: ReactNode;
    className?: string;
    bodyClassName?: string;
    hideHeader?: boolean;
}) {
    const titleId = useId();
    const descriptionId = useId();
    const dialogRef = useNativeDialog(open, onClose);

    return (
        <dialog
            aria-describedby={!hideHeader && description ? descriptionId : undefined}
            aria-label={hideHeader ? title : undefined}
            aria-labelledby={hideHeader ? undefined : titleId}
            className={cx("studio-sheet", className)}
            onCancel={(event) => {
                event.preventDefault();
                onClose();
            }}
            onClick={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
            ref={dialogRef}
        >
            <div className="studio-sheet__panel">
                {!hideHeader && (
                    <header className="studio-sheet__header">
                        <div className="studio-sheet__heading">
                            {eyebrow && <p className="studio-eyebrow">{eyebrow}</p>}
                            <h2 className="studio-sheet__title" id={titleId}>
                                {title}
                            </h2>
                            {description && (
                                <p className="studio-sheet__description" id={descriptionId}>
                                    {description}
                                </p>
                            )}
                        </div>
                        <IconButton icon="close" label={`Close ${title}`} onClick={onClose} />
                    </header>
                )}
                <div className={cx("studio-sheet__body", bodyClassName)}>{children}</div>
                {footer && <footer className="studio-sheet__footer">{footer}</footer>}
            </div>
        </dialog>
    );
}

export function StudioDialog({
    open,
    onClose,
    label,
    className,
    children,
}: {
    open: boolean;
    onClose: () => void;
    label: string;
    className?: string;
    children: ReactNode;
}) {
    const dialogRef = useNativeDialog(open, onClose);

    return (
        <dialog
            aria-label={label}
            className={cx("studio-dialog", className)}
            onCancel={(event) => {
                event.preventDefault();
                onClose();
            }}
            onClick={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
            ref={dialogRef}
        >
            <div className="studio-dialog__panel">{children}</div>
        </dialog>
    );
}
