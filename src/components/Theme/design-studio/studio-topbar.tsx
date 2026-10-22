"use client";

import { memo } from "react";
import { StudioIcon } from "./icons";
import { Badge, IconButton, Shortcut, StudioButton } from "./controls";

export const StudioTopbar = memo(function StudioTopbar({
    scopeLabel,
    isDirty,
    pending,
    canUndo,
    canRedo,
    onUndo,
    onRedo,
    onOpenPalette,
    onOpenSettings,
    onOpenInspector,
    selectionCount,
    onSave,
}: {
    scopeLabel: string;
    isDirty: boolean;
    pending: boolean;
    canUndo: boolean;
    canRedo: boolean;
    onUndo: () => void;
    onRedo: () => void;
    onOpenPalette: () => void;
    onOpenSettings: () => void;
    onOpenInspector: () => void;
    selectionCount: number;
    onSave: () => void;
}) {
    return (
        <header className="studio-topbar">
            <div className="studio-topbar__identity">
                <a
                    aria-label="Back to the photo studio"
                    className="studio-icon-button studio-topbar__back"
                    href="/upload"
                    title="Back to the photo studio"
                >
                    <StudioIcon name="arrow-left" size={17} />
                </a>
                <span aria-hidden="true" className="studio-topbar__mark">
                    <StudioIcon name="aperture" size={19} />
                </span>
                <span className="studio-topbar__wordmark">Photo Maker</span>
                <span aria-hidden="true" className="studio-topbar__rule" />
                <nav aria-label="Breadcrumb" className="studio-topbar__breadcrumb">
                    <span className="studio-topbar__crumb">Design studio</span>
                    <StudioIcon name="chevron-right" size={12} />
                    <span aria-current="page" className="studio-topbar__crumb studio-topbar__crumb--current">
                        {scopeLabel}
                    </span>
                </nav>
            </div>

            <div className="studio-topbar__actions">
                <span aria-live="polite" className="studio-topbar__status">
                    <Badge dot tone={isDirty ? "warning" : "success"}>
                        {pending ? "Publishing" : isDirty ? "Unpublished changes" : "Published"}
                    </Badge>
                </span>
                <div aria-label="History" className="studio-topbar__history" role="group">
                    <IconButton
                        disabled={!canUndo || pending}
                        icon="undo"
                        label="Undo change (Ctrl+Z)"
                        onClick={onUndo}
                    />
                    <IconButton
                        disabled={!canRedo || pending}
                        icon="redo"
                        label="Redo change (Ctrl+Y)"
                        onClick={onRedo}
                    />
                </div>
                <button
                    aria-keyshortcuts="Control+K Meta+K"
                    aria-label="Search settings and commands"
                    className="studio-search-trigger"
                    onClick={onOpenPalette}
                    type="button"
                >
                    <StudioIcon name="search" size={15} />
                    <span>Search</span>
                    <Shortcut>Ctrl K</Shortcut>
                </button>
                <span className="studio-topbar__compact">
                    <IconButton
                        aria-haspopup="dialog"
                        className="studio-topbar__settings-trigger"
                        icon="sliders"
                        label="Open design settings"
                        onClick={onOpenSettings}
                    />
                    <span className="studio-topbar__selection-wrap">
                        <IconButton
                            aria-haspopup="dialog"
                            className={selectionCount > 0 ? "has-selection" : undefined}
                            icon="cursor"
                            label={
                                selectionCount > 0
                                    ? `Open element inspector, ${selectionCount} selected`
                                    : "Open element inspector"
                            }
                            onClick={onOpenInspector}
                        />
                        {selectionCount > 0 && (
                            <span aria-hidden="true" className="studio-topbar__count">
                                {selectionCount}
                            </span>
                        )}
                    </span>
                </span>
                <StudioButton
                    className="studio-topbar__publish"
                    disabled={!isDirty || pending}
                    icon="save"
                    onClick={onSave}
                    variant="primary"
                >
                    <span className="studio-topbar__publish-long">
                        {pending ? "Publishing…" : isDirty ? "Publish changes" : "Published"}
                    </span>
                    <span className="studio-topbar__publish-short">
                        {pending ? "Saving…" : isDirty ? "Publish" : "Saved"}
                    </span>
                </StudioButton>
            </div>
        </header>
    );
});
