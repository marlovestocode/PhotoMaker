"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Badge, SelectField, Shortcut, cx } from "./controls";
import {
    STUDIO_SECTIONS,
    isSectionAvailable,
    pageLabel,
    sectionMatches,
    type StudioSectionDefinition,
} from "./constants";
import { StudioIcon } from "./icons";
import type { StudioSectionId } from "./types";

const GROUPS: Array<StudioSectionDefinition["group"]> = ["Foundation", "Page", "System"];

export function SettingsRail({
    activeSection,
    panel,
    selectedPage,
    allPagePaths,
    isGlobal,
    isDirty,
    isGalleryProfile,
    isUploadProfile,
    hasPageProfile,
    scopeOverrideCount,
    changeScope,
    onSelectSection,
    onBack,
    idPrefix = "studio",
}: {
    activeSection: StudioSectionId | null;
    panel: ReactNode;
    selectedPage: string;
    allPagePaths: string[];
    isGlobal: boolean;
    isDirty: boolean;
    isGalleryProfile: boolean;
    isUploadProfile: boolean;
    hasPageProfile: boolean;
    scopeOverrideCount: number;
    changeScope: (path: string) => void;
    onSelectSection: (section: StudioSectionId) => void;
    onBack: () => void;
    idPrefix?: string;
}) {
    const [query, setQuery] = useState("");
    const resultRefs = useRef<Array<HTMLButtonElement | null>>([]);
    const headingRef = useRef<HTMLHeadingElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const activeDefinition = STUDIO_SECTIONS.find((section) => section.id === activeSection) ?? null;
    const availableSections = STUDIO_SECTIONS.filter((section) =>
        isSectionAvailable(section.id, { isGalleryProfile, isUploadProfile }),
    );
    const filteredSections = availableSections.filter((section) => sectionMatches(section, query));
    const hasQuery = query.trim().length > 0;

    useEffect(() => {
        if (activeSection) {
            headingRef.current?.focus();
        }
    }, [activeSection]);

    useEffect(() => {
        function focusSearch(event: globalThis.KeyboardEvent) {
            if (
                event.key !== "/" ||
                event.ctrlKey ||
                event.metaKey ||
                event.altKey ||
                activeSection ||
                document.querySelector("dialog[open]")
            ) {
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

            if (searchInputRef.current) {
                event.preventDefault();
                searchInputRef.current.focus();
            }
        }

        window.addEventListener("keydown", focusSearch);
        return () => window.removeEventListener("keydown", focusSearch);
    }, [activeSection]);

    function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
        if (event.key === "ArrowDown") {
            event.preventDefault();
            resultRefs.current[0]?.focus();
        } else if (event.key === "Enter" && filteredSections[0]) {
            event.preventDefault();
            onSelectSection(filteredSections[0].id);
            setQuery("");
        } else if (event.key === "Escape" && query) {
            event.preventDefault();
            setQuery("");
        }
    }

    const scopeOptions = [
        { value: "__global__", label: "Entire site" },
        ...allPagePaths.map((path) => ({ value: path, label: pageLabel(path) })),
    ];

    return (
        <aside aria-label="Design settings navigation" className="studio-rail">
            <div className="studio-rail__top">
                <div className="studio-rail__scope">
                    <div className="studio-rail__scope-heading">
                        <span className="studio-eyebrow">Styling</span>
                        <Badge dot tone={isDirty ? "warning" : "success"}>
                            {isDirty ? "Draft changes" : "Published"}
                        </Badge>
                    </div>
                    <SelectField
                        label="Scope"
                        onChange={changeScope}
                        options={scopeOptions}
                        value={selectedPage}
                    />
                    {!isGlobal && (
                        <p className="studio-rail__scope-meta">
                            {hasPageProfile
                                ? `${scopeOverrideCount} override${scopeOverrideCount === 1 ? "" : "s"} on this page`
                                : "This page inherits the site design"}
                        </p>
                    )}
                </div>

                {!activeSection && (
                    <div className="studio-rail__search">
                        <label className="studio-sr-only" htmlFor={`${idPrefix}-rail-search`}>
                            Find a design setting
                        </label>
                        <StudioIcon className="studio-rail__search-icon" name="search" size={15} />
                        <input
                            autoComplete="off"
                            className="studio-input studio-rail__search-input"
                            id={`${idPrefix}-rail-search`}
                            onChange={(event) => setQuery(event.target.value)}
                            onKeyDown={handleSearchKeyDown}
                            placeholder="Find a setting"
                            ref={searchInputRef}
                            spellCheck={false}
                            type="search"
                            value={query}
                        />
                        {hasQuery ? (
                            <button
                                aria-label="Clear setting search"
                                className="studio-rail__search-clear"
                                onClick={() => setQuery("")}
                                type="button"
                            >
                                <StudioIcon name="close" size={13} />
                            </button>
                        ) : (
                            <span aria-hidden="true" className="studio-rail__search-kbd">
                                /
                            </span>
                        )}
                    </div>
                )}
            </div>

            <div className="studio-rail__scroll">
                {activeSection && activeDefinition ? (
                    <div className="studio-panel">
                        <div className="studio-panel__header">
                            <button className="studio-back" onClick={onBack} type="button">
                                <StudioIcon name="arrow-left" size={14} />
                                All settings
                            </button>
                            <div className="studio-panel__title-row">
                                <span aria-hidden="true" className="studio-panel__icon">
                                    <StudioIcon name={activeDefinition.icon} size={18} />
                                </span>
                                <h2 className="studio-panel__title" ref={headingRef} tabIndex={-1}>
                                    {activeDefinition.label}
                                </h2>
                            </div>
                            <p className="studio-panel__description">{activeDefinition.description}</p>
                        </div>
                        {panel}
                    </div>
                ) : (
                    <nav aria-label="Design settings sections" className="studio-nav">
                        {hasQuery && (
                            <p aria-live="polite" className="studio-nav__results">
                                {filteredSections.length} setting
                                {filteredSections.length === 1 ? "" : "s"} found
                            </p>
                        )}
                        {GROUPS.map((group) => {
                            const sections = filteredSections.filter(
                                (section) => section.group === group,
                            );
                            if (sections.length === 0) return null;
                            return (
                                <div className="studio-nav__group" key={group}>
                                    <p className="studio-nav__group-label">{group}</p>
                                    <ul>
                                        {sections.map((section) => (
                                            <li key={section.id}>
                                                <button
                                                    className="studio-nav__item"
                                                    onClick={() => {
                                                        onSelectSection(section.id);
                                                        setQuery("");
                                                    }}
                                                    ref={(element) => {
                                                        resultRefs.current[
                                                            filteredSections.findIndex(
                                                                (candidate) =>
                                                                    candidate.id === section.id,
                                                            )
                                                        ] = element;
                                                    }}
                                                    type="button"
                                                >
                                                    <span aria-hidden="true" className="studio-nav__icon">
                                                        <StudioIcon name={section.icon} size={17} />
                                                    </span>
                                                    <span className="studio-nav__copy">
                                                        <span className="studio-nav__label">{section.label}</span>
                                                        <span className="studio-nav__description">
                                                            {section.description}
                                                        </span>
                                                    </span>
                                                    <StudioIcon
                                                        className="studio-nav__chevron"
                                                        name="chevron-right"
                                                        size={14}
                                                    />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            );
                        })}
                        {filteredSections.length === 0 && (
                            <div className="studio-nav__empty">
                                <span aria-hidden="true" className="studio-nav__empty-icon">
                                    <StudioIcon name="search" size={20} />
                                </span>
                                <p>No settings match “{query}”.</p>
                                <button className="studio-link" onClick={() => setQuery("")} type="button">
                                    Clear search
                                </button>
                            </div>
                        )}
                        {!hasQuery && !isGalleryProfile && !isUploadProfile && (
                            <p className="studio-nav__note">
                                <StudioIcon name="lock" size={13} />
                                Gallery and photo studio settings appear when that route scope is
                                selected.
                            </p>
                        )}
                    </nav>
                )}
            </div>

            <footer className="studio-rail__footer">
                <span className={cx("studio-rail__status", isDirty && "is-dirty")}>
                    <span aria-hidden="true" />
                    {isDirty ? "Unpublished changes" : "Everything published"}
                </span>
                <span className="studio-rail__shortcut">
                    <Shortcut>Ctrl</Shortcut>
                    <Shortcut>K</Shortcut>
                </span>
            </footer>
        </aside>
    );
}
