"use client";

import { useState, type ReactNode } from "react";
import { builtInLayoutPresets, type DesignTokens } from "@/theme/design-system";
import {
    Badge,
    Callout,
    PanelActions,
    StudioButton,
    TextField,
    cx,
} from "../controls";
import { FONT_OPTIONS } from "../constants";
import { StudioIcon } from "../icons";
import type { SavedPreset } from "../types";

function PresetCard({
    active,
    disabled,
    name,
    onApply,
    tokens,
    badges,
    footer,
}: {
    active: boolean;
    disabled: boolean;
    name: string;
    onApply: () => void;
    tokens: DesignTokens;
    badges: string[];
    footer?: ReactNode;
}) {
    const fontLabel = FONT_OPTIONS.find((option) => option.value === tokens.headingFont)?.label;

    return (
        <article className={cx("studio-preset-card", active && "is-active")}>
            <div aria-hidden="true" className="studio-preset-card__swatches">
                {[tokens.background, tokens.surface, tokens.accent, tokens.text].map((color) => (
                    <span key={color} style={{ backgroundColor: color }} />
                ))}
            </div>
            <div className="studio-preset-card__body">
                <div className="studio-preset-card__heading">
                    <h3>{name}</h3>
                    {active && <Badge tone="accent">Applied</Badge>}
                </div>
                <p className="studio-preset-card__meta">
                    {fontLabel} · {tokens.headingSize}px headings · {tokens.cornerRadius}px corners
                </p>
                <div className="studio-preset-card__badges">
                    {badges.map((badge) => (
                        <span className="studio-preset-card__badge" key={badge}>
                            {badge}
                        </span>
                    ))}
                </div>
            </div>
            <div className="studio-preset-card__actions">
                <StudioButton
                    disabled={active || disabled}
                    onClick={onApply}
                    size="sm"
                    variant={active ? "quiet" : "secondary"}
                >
                    {active ? "Applied" : "Apply preset"}
                </StudioButton>
                {footer}
            </div>
        </article>
    );
}

export function PresetsPanel({
    activePresetId,
    customPresets,
    scopeLabel,
    pending,
    savePreset,
    deletePreset,
    selectPreset,
}: {
    activePresetId: string;
    customPresets: SavedPreset[];
    scopeLabel: string;
    pending: boolean;
    savePreset: (name: string) => Promise<boolean>;
    deletePreset: (id: string) => Promise<boolean>;
    selectPreset: (id: string) => void;
}) {
    const [name, setName] = useState("");
    const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

    async function handleSave() {
        if (!name.trim()) return;
        const saved = await savePreset(name);
        if (saved) setName("");
    }

    return (
        <div className="studio-panel-stack">
            <Callout tone="info">
                <p>
                    Presets apply a complete token set to <strong>{scopeLabel}</strong>. They do not
                    replace page copy, route profiles, or element overrides.
                </p>
            </Callout>

            <section aria-label="Built-in presets" className="studio-panel-group">
                <div className="studio-panel-group__header">
                    <h3>Built-in styles</h3>
                    <p>Considered starting points drawn from the site&apos;s original palette.</p>
                </div>
                <div className="studio-preset-list">
                    {builtInLayoutPresets.map((preset) => (
                        <PresetCard
                            active={activePresetId === preset.id}
                            badges={[preset.tokens.layout]}
                            disabled={pending}
                            key={preset.id}
                            name={preset.name}
                            onApply={() => selectPreset(preset.id)}
                            tokens={preset.tokens}
                        />
                    ))}
                </div>
            </section>

            <section aria-label="Saved presets" className="studio-panel-group">
                <div className="studio-panel-group__header">
                    <h3>Saved presets</h3>
                    <p>Reusable looks stored with your studio.</p>
                </div>
                {customPresets.length === 0 ? (
                    <div className="studio-empty-inline">
                        <StudioIcon name="layers" size={20} />
                        <p>No saved presets yet. Save the current look below.</p>
                    </div>
                ) : (
                    <div className="studio-preset-list">
                        {customPresets.map((preset) => (
                            <PresetCard
                                active={activePresetId === preset.id}
                                badges={[preset.tokens.layout, "Saved"]}
                                disabled={pending}
                                key={preset.id}
                                name={preset.name}
                                onApply={() => selectPreset(preset.id)}
                                tokens={preset.tokens}
                                footer={
                                    confirmingDeleteId === preset.id ? (
                                        <div className="studio-inline-confirm" role="group" aria-label={`Delete ${preset.name}`}>
                                            <span>Delete?</span>
                                            <button
                                                className="studio-link studio-link--danger"
                                                disabled={pending}
                                                onClick={async () => {
                                                    const deleted = await deletePreset(preset.id);
                                                    if (deleted) setConfirmingDeleteId(null);
                                                }}
                                                type="button"
                                            >
                                                Yes
                                            </button>
                                            <button
                                                className="studio-link"
                                                onClick={() => setConfirmingDeleteId(null)}
                                                type="button"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            aria-label={`Delete preset ${preset.name}`}
                                            className="studio-icon-button studio-icon-button--sm"
                                            disabled={pending}
                                            onClick={() => setConfirmingDeleteId(preset.id)}
                                            title="Delete saved preset"
                                            type="button"
                                        >
                                            <StudioIcon name="trash" size={14} />
                                        </button>
                                    )
                                }
                            />
                        ))}
                    </div>
                )}
            </section>

            <section aria-label="Save a preset" className="studio-panel-group studio-save-preset">
                <div className="studio-panel-group__header">
                    <h3>Save the current look</h3>
                    <p>Captures the tokens for {scopeLabel}. Page content stays untouched.</p>
                </div>
                <TextField
                    label="Preset name"
                    maxLength={50}
                    onChange={setName}
                    placeholder="My family style"
                    value={name}
                />
                <PanelActions>
                    <StudioButton
                        disabled={pending || !name.trim()}
                        icon="plus"
                        onClick={handleSave}
                        size="sm"
                        variant="primary"
                    >
                        {pending ? "Saving…" : "Save preset"}
                    </StudioButton>
                </PanelActions>
            </section>
        </div>
    );
}
