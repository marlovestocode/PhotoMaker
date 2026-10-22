"use client";

import { useState } from "react";
import { ActionRow, Badge, Shortcut, StudioButton } from "../controls";
import { pageLabel } from "../constants";
import { StudioIcon } from "../icons";

export function ToolsPanel({
    scopeLabel,
    isDirty,
    canUndo,
    canRedo,
    pending,
    previewPage,
    removedElements,
    undoDesign,
    redoDesign,
    restoreSavedDesign,
    resetCurrentScope,
    onRequestResetDefaults,
    copyCurrentDesign,
    pasteCurrentDesign,
    restoreElement,
}: {
    scopeLabel: string;
    isDirty: boolean;
    canUndo: boolean;
    canRedo: boolean;
    pending: boolean;
    previewPage: string;
    removedElements: string[];
    undoDesign: () => void;
    redoDesign: () => void;
    restoreSavedDesign: () => void;
    resetCurrentScope: () => void;
    onRequestResetDefaults: () => void;
    copyCurrentDesign: () => void;
    pasteCurrentDesign: () => void;
    restoreElement: (locator: string) => void;
}) {
    const [confirmingScopeReset, setConfirmingScopeReset] = useState(false);

    return (
        <div className="studio-panel-stack">
            <section aria-label="History" className="studio-panel-group">
                <div className="studio-panel-group__header">
                    <h3>History</h3>
                    <p>Undo covers design changes in this session. Slider drags group into one step.</p>
                </div>
                <ActionRow>
                    <StudioButton disabled={!canUndo || pending} icon="undo" onClick={undoDesign} size="sm">
                        Undo
                    </StudioButton>
                    <StudioButton disabled={!canRedo || pending} icon="redo" onClick={redoDesign} size="sm">
                        Redo
                    </StudioButton>
                    <StudioButton
                        disabled={!isDirty || pending}
                        icon="rotate"
                        onClick={restoreSavedDesign}
                        size="sm"
                        variant="ghost"
                    >
                        Revert unpublished
                    </StudioButton>
                </ActionRow>
                <dl className="studio-shortcut-list">
                    <div>
                        <dt>Undo</dt>
                        <dd>
                            <Shortcut>Ctrl</Shortcut>
                            <Shortcut>Z</Shortcut>
                        </dd>
                    </div>
                    <div>
                        <dt>Redo</dt>
                        <dd>
                            <Shortcut>Ctrl</Shortcut>
                            <Shortcut>Y</Shortcut>
                        </dd>
                    </div>
                    <div>
                        <dt>Search</dt>
                        <dd>
                            <Shortcut>Ctrl</Shortcut>
                            <Shortcut>K</Shortcut>
                        </dd>
                    </div>
                    <div>
                        <dt>Finish selecting</dt>
                        <dd>
                            <Shortcut>Esc</Shortcut>
                        </dd>
                    </div>
                </dl>
            </section>

            <section aria-label="Reset design" className="studio-panel-group">
                <div className="studio-panel-group__header">
                    <h3>Reset</h3>
                    <p>Restore a known state. Resets stay unpublished until you publish.</p>
                </div>
                <div className="studio-reset-row">
                    <div>
                        <p className="studio-reset-row__title">Reset {scopeLabel}</p>
                        <p className="studio-reset-row__description">
                            Restores the last published values for the current scope.
                        </p>
                    </div>
                    <StudioButton
                        disabled={pending}
                        onClick={() => setConfirmingScopeReset(true)}
                        size="sm"
                        variant="ghost"
                    >
                        Reset scope
                    </StudioButton>
                </div>
                {confirmingScopeReset && (
                    <div className="studio-inline-confirm" role="group" aria-label="Reset current scope">
                        <span>Restore this scope to published values?</span>
                        <button
                            className="studio-link"
                            onClick={() => {
                                resetCurrentScope();
                                setConfirmingScopeReset(false);
                            }}
                            type="button"
                        >
                            Reset scope
                        </button>
                        <button
                            className="studio-link"
                            onClick={() => setConfirmingScopeReset(false)}
                            type="button"
                        >
                            Cancel
                        </button>
                    </div>
                )}
                <div className="studio-reset-row studio-reset-row--danger">
                    <div>
                        <p className="studio-reset-row__title">Reset the entire design</p>
                        <p className="studio-reset-row__description">
                            Clears every page profile and returns to the original defaults.
                        </p>
                    </div>
                    <StudioButton
                        disabled={pending}
                        onClick={onRequestResetDefaults}
                        size="sm"
                        variant="ghost-danger"
                    >
                        Reset defaults
                    </StudioButton>
                </div>
            </section>

            <section aria-label="Clipboard" className="studio-panel-group">
                <div className="studio-panel-group__header">
                    <h3>Clipboard</h3>
                    <p>Move a token set from one scope to another.</p>
                </div>
                <ActionRow>
                    <StudioButton icon="copy" onClick={copyCurrentDesign} size="sm">
                        Copy design
                    </StudioButton>
                    <StudioButton icon="clipboard-paste" onClick={pasteCurrentDesign} size="sm">
                        Paste design
                    </StudioButton>
                </ActionRow>
                <p className="studio-hint">
                    Copy captures {scopeLabel} tokens only. Paste merges them into the scope currently
                    selected in the rail.
                </p>
            </section>

            <section aria-label="Removed elements" className="studio-panel-group">
                <div className="studio-panel-group__header">
                    <h3>Removed from {pageLabel(previewPage)}</h3>
                    <p>Removed elements stay in the app and can be restored at any time.</p>
                </div>
                {removedElements.length === 0 ? (
                    <div className="studio-empty-inline">
                        <StudioIcon name="restore" size={20} />
                        <p>Nothing has been removed from this page.</p>
                    </div>
                ) : (
                    <ul className="studio-removed-list">
                        {removedElements.map((locator) => (
                            <li key={locator}>
                                <code>{locator}</code>
                                <StudioButton
                                    icon="restore"
                                    onClick={() => restoreElement(locator)}
                                    size="sm"
                                    variant="ghost"
                                >
                                    Restore
                                </StudioButton>
                            </li>
                        ))}
                    </ul>
                )}
                <Badge tone="neutral">{pageLabel(previewPage)}</Badge>
            </section>
        </div>
    );
}
