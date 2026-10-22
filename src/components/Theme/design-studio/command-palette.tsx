"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { StudioIcon, type StudioIconName } from "./icons";
import { Shortcut, cx } from "./controls";
import { StudioDialog } from "./sheet";

export type CommandAction = {
    id: string;
    label: string;
    group: string;
    icon: StudioIconName;
    keywords?: string;
    hint?: string;
    shortcut?: string;
    disabled?: boolean;
    run: () => void;
};

export function CommandPalette({
    open,
    onClose,
    actions,
}: {
    open: boolean;
    onClose: () => void;
    actions: CommandAction[];
}) {
    const [query, setQuery] = useState("");
    const [activeIndexState, setActiveIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const listboxId = useId();

    const filtered = useMemo(() => {
        const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
        if (terms.length === 0) return actions;
        return actions.filter((action) => {
            const haystack = `${action.label} ${action.group} ${action.keywords ?? ""}`.toLocaleLowerCase();
            return terms.every((term) => haystack.includes(term));
        });
    }, [actions, query]);

    const enabledIndexes = useMemo(
        () => filtered.flatMap((action, index) => (action.disabled ? [] : [index])),
        [filtered],
    );
    const activeIndex = enabledIndexes.includes(activeIndexState)
        ? activeIndexState
        : (enabledIndexes[0] ?? 0);

    useEffect(() => {
        const frame = window.requestAnimationFrame(() => inputRef.current?.focus());
        return () => window.cancelAnimationFrame(frame);
    }, []);

    useEffect(() => {
        if (!open) return;
        const option = listRef.current?.querySelector<HTMLElement>(`[data-command-index="${activeIndex}"]`);
        option?.scrollIntoView({ block: "nearest" });
    }, [activeIndex, open]);

    function moveActive(direction: 1 | -1) {
        if (enabledIndexes.length === 0) return;
        const position = enabledIndexes.indexOf(activeIndex);
        const nextPosition =
            position === -1
                ? 0
                : (position + direction + enabledIndexes.length) % enabledIndexes.length;
        setActiveIndex(enabledIndexes[nextPosition]);
    }

    function runAction(action: CommandAction | undefined) {
        if (!action || action.disabled) return;
        onClose();
        action.run();
    }

    function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
        if (event.key === "ArrowDown") {
            event.preventDefault();
            moveActive(1);
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            moveActive(-1);
        } else if (event.key === "Home") {
            event.preventDefault();
            if (enabledIndexes.length > 0) setActiveIndex(enabledIndexes[0]);
        } else if (event.key === "End") {
            event.preventDefault();
            if (enabledIndexes.length > 0) setActiveIndex(enabledIndexes[enabledIndexes.length - 1]);
        } else if (event.key === "Enter") {
            event.preventDefault();
            runAction(filtered[activeIndex]);
        } else if (event.key === "Escape") {
            event.preventDefault();
            onClose();
        }
    }

    return (
        <StudioDialog className="studio-palette" label="Search settings and commands" onClose={onClose} open={open}>
            <div className="studio-palette__search">
                <StudioIcon className="studio-palette__search-icon" name="search" size={18} />
                <input
                    aria-activedescendant={
                        filtered[activeIndex] ? `${listboxId}-${filtered[activeIndex].id}` : undefined
                    }
                    aria-autocomplete="list"
                    aria-controls={listboxId}
                    aria-expanded="true"
                    aria-label="Search settings and commands"
                    autoComplete="off"
                    className="studio-palette__input"
                    onChange={(event) => {
                        setQuery(event.target.value);
                        setActiveIndex(0);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Search settings and commands"
                    ref={inputRef}
                    role="combobox"
                    spellCheck={false}
                    type="text"
                    value={query}
                />
                <Shortcut>Esc</Shortcut>
            </div>

            <div
                aria-label="Commands"
                className="studio-palette__list"
                id={listboxId}
                ref={listRef}
                role="listbox"
            >
                {filtered.length === 0 && (
                    <div className="studio-palette__empty">
                        <StudioIcon name="search" size={20} />
                        <p>No settings match “{query}”.</p>
                        <button className="studio-link" onClick={() => setQuery("")} type="button">
                            Clear search
                        </button>
                    </div>
                )}
                {filtered.map((action, index) => {
                    const showGroup = index === 0 || filtered[index - 1].group !== action.group;
                    const active = index === activeIndex;
                    return (
                        <div className="studio-palette__group" key={action.id}>
                            {showGroup && (
                                <p aria-hidden="true" className="studio-palette__group-label">
                                    {action.group}
                                </p>
                            )}
                            <button
                                aria-disabled={action.disabled || undefined}
                                aria-selected={active}
                                className={cx(
                                    "studio-palette__option",
                                    active && "is-active",
                                    action.disabled && "is-disabled",
                                )}
                                data-command-index={index}
                                id={`${listboxId}-${action.id}`}
                                onClick={() => runAction(action)}
                                onMouseEnter={() => {
                                    if (!action.disabled) setActiveIndex(index);
                                }}
                                role="option"
                                tabIndex={-1}
                                type="button"
                            >
                                <span className="studio-palette__option-icon">
                                    <StudioIcon name={action.icon} size={16} />
                                </span>
                                <span className="studio-palette__option-copy">
                                    <span className="studio-palette__option-label">{action.label}</span>
                                    {action.hint && (
                                        <span className="studio-palette__option-hint">{action.hint}</span>
                                    )}
                                </span>
                                {action.shortcut && <Shortcut>{action.shortcut}</Shortcut>}
                                {active && !action.disabled && (
                                    <StudioIcon
                                        className="studio-palette__enter"
                                        name="chevron-right"
                                        size={14}
                                    />
                                )}
                            </button>
                        </div>
                    );
                })}
            </div>

            <div className="studio-palette__footer">
                <span>
                    <Shortcut>↑</Shortcut>
                    <Shortcut>↓</Shortcut> to navigate
                </span>
                <span>
                    <Shortcut>Enter</Shortcut> to open
                </span>
                <span className="studio-palette__count">
                    {enabledIndexes.length} command{enabledIndexes.length === 1 ? "" : "s"}
                </span>
            </div>
        </StudioDialog>
    );
}
