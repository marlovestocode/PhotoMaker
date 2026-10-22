"use client";

import { useState } from "react";
import type { SiteDesign } from "@/theme/design-system";
import {
    Badge,
    Callout,
    PanelActions,
    SelectField,
    StudioButton,
    TextField,
} from "../controls";
import { pageLabel, STUDIO_ROUTE } from "../constants";
import { StudioIcon } from "../icons";

export function RoutesPanel({
    design,
    selectedPage,
    allPagePaths,
    hasPageProfile,
    scopeOverrideCount,
    changeScope,
    addPageProfile,
    resetPageProfile,
}: {
    design: SiteDesign;
    selectedPage: string;
    allPagePaths: string[];
    hasPageProfile: boolean;
    scopeOverrideCount: number;
    changeScope: (path: string) => void;
    addPageProfile: (path: string) => { ok: boolean; error?: string };
    resetPageProfile: () => void;
}) {
    const [newPath, setNewPath] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [confirmingInherit, setConfirmingInherit] = useState(false);
    const profiles = Object.entries(design.pages)
        .filter(([path]) => path !== STUDIO_ROUTE)
        .sort(([left], [right]) => left.localeCompare(right));

    function handleAdd() {
        const result = addPageProfile(newPath);
        if (result.ok) {
            setNewPath("");
            setError(null);
        } else {
            setError(result.error ?? "That route could not be added.");
        }
    }

    return (
        <div className="studio-panel-stack">
            <section aria-label="Current scope" className="studio-panel-group">
                <div className="studio-panel-group__header">
                    <h3>Current scope</h3>
                    <p>Site-wide settings are inherited by every route until a profile overrides them.</p>
                </div>
                <SelectField
                    label="Editing"
                    onChange={changeScope}
                    options={[
                        { value: "__global__", label: "Entire site · foundation" },
                        ...allPagePaths.map((path) => ({
                            value: path,
                            label: `${pageLabel(path)} · ${
                                design.pages[path] ? "page profile" : "inherits site"
                            }`,
                        })),
                    ]}
                    value={selectedPage}
                />
                <div className="studio-scope-card">
                    <div>
                        <p className="studio-scope-card__title">
                            {selectedPage === "__global__" ? "Entire site" : pageLabel(selectedPage)}
                        </p>
                        <p className="studio-scope-card__path">
                            {selectedPage === "__global__" ? "All routes" : selectedPage}
                        </p>
                    </div>
                    <Badge tone={selectedPage === "__global__" ? "accent" : hasPageProfile ? "warning" : "neutral"}>
                        {selectedPage === "__global__"
                            ? "Foundation"
                            : hasPageProfile
                              ? `${scopeOverrideCount} override${scopeOverrideCount === 1 ? "" : "s"}`
                              : "Inherits site"}
                    </Badge>
                </div>
                <div className="studio-action-row">
                    <StudioButton
                        icon="palette"
                        onClick={() => changeScope("__global__")}
                        size="sm"
                        variant="secondary"
                    >
                        Edit site design
                    </StudioButton>
                    {selectedPage !== "__global__" && (
                        <StudioButton
                            disabled={!hasPageProfile}
                            icon="restore"
                            onClick={() => setConfirmingInherit(true)}
                            size="sm"
                            variant="ghost"
                        >
                            Inherit everything
                        </StudioButton>
                    )}
                </div>
                {confirmingInherit && selectedPage !== "__global__" && (
                    <div className="studio-inline-confirm" role="group" aria-label="Remove page profile">
                        <span>Remove this page&apos;s overrides?</span>
                        <button
                            className="studio-link studio-link--danger"
                            onClick={() => {
                                resetPageProfile();
                                setConfirmingInherit(false);
                            }}
                            type="button"
                        >
                            Remove overrides
                        </button>
                        <button className="studio-link" onClick={() => setConfirmingInherit(false)} type="button">
                            Cancel
                        </button>
                    </div>
                )}
            </section>

            <section aria-label="Add route profile" className="studio-panel-group">
                <div className="studio-panel-group__header">
                    <h3>Add a route profile</h3>
                    <p>Style a specific page or a dynamic template such as /photo/[id].</p>
                </div>
                <TextField
                    hint="Must start with /. Query strings, hashes, and traversal segments are rejected."
                    label="Route path"
                    mono
                    onChange={(value) => {
                        setNewPath(value);
                        setError(null);
                    }}
                    placeholder="/memories/[slug]"
                    value={newPath}
                />
                {error && (
                    <Callout role="alert" tone="danger">
                        <p>{error}</p>
                    </Callout>
                )}
                <PanelActions>
                    <StudioButton
                        disabled={!newPath.trim()}
                        icon="plus"
                        onClick={handleAdd}
                        size="sm"
                        variant="primary"
                    >
                        Add profile
                    </StudioButton>
                </PanelActions>
            </section>

            <section aria-label="Page profiles" className="studio-panel-group">
                <div className="studio-panel-group__header">
                    <h3>Page profiles</h3>
                    <p>Routes with their own overrides. A route profile controls styling only.</p>
                </div>
                {profiles.length === 0 ? (
                    <div className="studio-empty-inline">
                        <StudioIcon name="route" size={20} />
                        <p>Every route inherits the site design. Add a profile to customize one.</p>
                    </div>
                ) : (
                    <ul className="studio-route-list">
                        {profiles.map(([path, page]) => {
                            const overrides = Object.keys(page).length;
                            return (
                                <li className={path === selectedPage ? "is-current" : undefined} key={path}>
                                    <div className="studio-route-list__copy">
                                        <span className="studio-route-list__label">{pageLabel(path)}</span>
                                        <code>{path}</code>
                                    </div>
                                    <div className="studio-route-list__meta">
                                        <Badge tone={overrides > 0 ? "warning" : "neutral"}>
                                            {overrides > 0 ? `${overrides} override${overrides === 1 ? "" : "s"}` : "Empty"}
                                        </Badge>
                                        <StudioButton
                                            aria-pressed={path === selectedPage}
                                            onClick={() => changeScope(path)}
                                            size="sm"
                                            variant={path === selectedPage ? "quiet" : "ghost"}
                                        >
                                            {path === selectedPage ? "Editing" : "Edit"}
                                        </StudioButton>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>
        </div>
    );
}
