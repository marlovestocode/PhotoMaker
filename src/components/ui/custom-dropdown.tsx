"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";

export type DropdownOption<T extends string = string> = {
    disabled?: boolean;
    label: string;
    value: T;
};

export function CustomDropdown<T extends string>({
    ariaLabel,
    buttonClassName,
    describedBy,
    disabled = false,
    id,
    menuClassName,
    menuLabel,
    onChange,
    optionClassName,
    options,
    portal = false,
    selectedOptionClassName,
    value,
}: {
    ariaLabel: string;
    buttonClassName?: string;
    describedBy?: string;
    disabled?: boolean;
    id?: string;
    menuClassName?: string;
    menuLabel?: string;
    onChange: (value: T) => void;
    optionClassName?: string;
    options: DropdownOption<T>[];
    portal?: boolean;
    selectedOptionClassName?: string;
    value: T;
}) {
    const generatedId = useId();
    const listboxId = `${generatedId}-options`;
    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
    const [open, setOpen] = useState(false);
    const [menuHost, setMenuHost] = useState<HTMLElement | null>(null);
    const [menuStyle, setMenuStyle] = useState<CSSProperties>();
    const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
    const enabledIndexes = options.flatMap((option, index) => (option.disabled ? [] : [index]));

    useEffect(() => {
        if (open) {
            const focusIndex = enabledIndexes.includes(selectedIndex)
                ? selectedIndex
                : (enabledIndexes[0] ?? selectedIndex);
            optionRefs.current[focusIndex]?.focus();
        }
    }, [enabledIndexes, open, selectedIndex]);

    useEffect(() => {
        if (!open) return;

        function closeOnOutsidePointer(event: PointerEvent) {
            if (
                event.target instanceof Node &&
                !containerRef.current?.contains(event.target) &&
                !menuRef.current?.contains(event.target)
            ) {
                setOpen(false);
            }
        }

        function closeOnViewportChange(event: Event) {
            if (event.target instanceof Node && menuRef.current?.contains(event.target)) {
                return;
            }
            setOpen(false);
        }

        document.addEventListener("pointerdown", closeOnOutsidePointer);
        window.addEventListener("resize", closeOnViewportChange);
        window.addEventListener("scroll", closeOnViewportChange, true);
        return () => {
            document.removeEventListener("pointerdown", closeOnOutsidePointer);
            window.removeEventListener("resize", closeOnViewportChange);
            window.removeEventListener("scroll", closeOnViewportChange, true);
        };
    }, [open]);

    function openMenu() {
        if (disabled) return;

        if (portal && triggerRef.current) {
            const trigger = triggerRef.current;
            const rect = trigger.getBoundingClientRect();
            const spaceAbove = rect.top - 12;
            const spaceBelow = window.innerHeight - rect.bottom - 12;
            const opensUp = spaceBelow < 180 && spaceAbove > spaceBelow;
            const width = Math.min(Math.max(rect.width, 180), window.innerWidth - 16);
            const left = Math.min(Math.max(8, rect.left), window.innerWidth - width - 8);

            setMenuHost(trigger.closest("dialog") ?? document.body);
            setMenuStyle({
                position: "fixed",
                left,
                width,
                maxHeight: Math.min(280, Math.max(120, opensUp ? spaceAbove : spaceBelow)),
                zIndex: 90,
                ...(opensUp
                    ? { bottom: window.innerHeight - rect.top + 6 }
                    : { top: rect.bottom + 6 }),
            });
        }

        setOpen(true);
    }

    function openWithKeyboard(event: KeyboardEvent<HTMLButtonElement>) {
        if (disabled) return;

        if (event.key === "Escape" && open) {
            event.preventDefault();
            setOpen(false);
            return;
        }

        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            openMenu();
        }
    }

    function moveFocus(event: KeyboardEvent<HTMLButtonElement>, index: number) {
        let nextIndex = index;

        if (event.key === "ArrowDown") {
            nextIndex = enabledIndexes.find((candidate) => candidate > index) ?? index;
        } else if (event.key === "ArrowUp") {
            nextIndex = [...enabledIndexes].reverse().find((candidate) => candidate < index) ?? index;
        } else if (event.key === "Home") {
            nextIndex = enabledIndexes[0] ?? index;
        } else if (event.key === "End") {
            nextIndex = enabledIndexes.at(-1) ?? index;
        } else if (event.key === "Escape") {
            event.preventDefault();
            setOpen(false);
            triggerRef.current?.focus();
            return;
        } else if (event.key === "Tab") {
            setOpen(false);
            triggerRef.current?.focus();
            return;
        } else {
            return;
        }

        event.preventDefault();
        optionRefs.current[nextIndex]?.focus();
    }

    const selectedOption = options.find((option) => option.value === value) ?? options[0];
    const baseOptionClass =
        "flex min-h-10 w-full items-center justify-between gap-4 rounded-lg px-3 py-2 text-left text-sm";

    const menu = open ? (
        <div
            aria-label={menuLabel ?? ariaLabel}
            className={
                menuClassName ??
                "absolute right-0 top-full z-40 mt-2 max-h-60 min-w-full w-max overflow-y-auto rounded-xl border border-stone-300 bg-white p-1 shadow-lg"
            }
            id={listboxId}
            ref={menuRef}
            role="listbox"
            style={portal ? menuStyle : undefined}
        >
            {options.map((option, index) => {
                const isSelected = option.value === value;
                return (
                    <button
                        aria-selected={isSelected}
                        className={
                            optionClassName
                                ? [optionClassName, isSelected && selectedOptionClassName]
                                      .filter(Boolean)
                                      .join(" ")
                                : `${baseOptionClass} ${
                                      isSelected
                                          ? "bg-amber-50 font-semibold text-amber-900"
                                          : "text-stone-800 hover:bg-stone-100"
                                  }`
                        }
                        disabled={option.disabled}
                        key={option.value}
                        onClick={() => {
                            onChange(option.value);
                            setOpen(false);
                            triggerRef.current?.focus();
                        }}
                        onKeyDown={(event) => moveFocus(event, index)}
                        ref={(element) => {
                            optionRefs.current[index] = element;
                        }}
                        role="option"
                        type="button"
                    >
                        {option.label}
                        {isSelected && <span aria-hidden="true">✓</span>}
                    </button>
                );
            })}
        </div>
    ) : null;

    return (
        <div className="relative" ref={containerRef}>
            <button
                aria-controls={listboxId}
                aria-describedby={describedBy}
                aria-expanded={open}
                aria-haspopup="listbox"
                aria-label={ariaLabel}
                className={
                    buttonClassName ??
                    "flex min-h-10 min-w-36 items-center justify-between gap-3 rounded-lg border border-stone-300 bg-white px-3 text-left text-sm text-stone-800 shadow-sm hover:bg-stone-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-800"
                }
                disabled={disabled}
                id={id}
                onClick={() => {
                    if (open) setOpen(false);
                    else openMenu();
                }}
                onKeyDown={openWithKeyboard}
                ref={triggerRef}
                type="button"
            >
                <span>{selectedOption?.label ?? "Choose an option"}</span>
                <svg
                    aria-hidden="true"
                    className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                >
                    <path d="m5.5 7.5 4.5 4.5 4.5-4.5" />
                </svg>
            </button>
            {menu && (portal ? (menuHost ? createPortal(menu, menuHost) : null) : menu)}
        </div>
    );
}
