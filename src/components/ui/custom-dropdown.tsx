"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

export type DropdownOption<T extends string = string> = {
    label: string;
    value: T;
};

export function CustomDropdown<T extends string>({
    ariaLabel,
    buttonClassName,
    id,
    onChange,
    options,
    value,
}: {
    ariaLabel: string;
    buttonClassName?: string;
    id?: string;
    onChange: (value: T) => void;
    options: DropdownOption<T>[];
    value: T;
}) {
    const generatedId = useId();
    const listboxId = `${generatedId}-options`;
    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
    const [open, setOpen] = useState(false);
    const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));

    useEffect(() => {
        if (open) {
            optionRefs.current[selectedIndex]?.focus();
        }
    }, [open, selectedIndex]);

    useEffect(() => {
        if (!open) return;

        function closeOnOutsidePointer(event: PointerEvent) {
            if (event.target instanceof Node && !containerRef.current?.contains(event.target)) {
                setOpen(false);
            }
        }

        document.addEventListener("pointerdown", closeOnOutsidePointer);
        return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
    }, [open]);

    function openWithKeyboard(event: KeyboardEvent<HTMLButtonElement>) {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setOpen(true);
        }
    }

    function moveFocus(event: KeyboardEvent<HTMLButtonElement>, index: number) {
        let nextIndex = index;

        if (event.key === "ArrowDown") nextIndex = Math.min(options.length - 1, index + 1);
        else if (event.key === "ArrowUp") nextIndex = Math.max(0, index - 1);
        else if (event.key === "Home") nextIndex = 0;
        else if (event.key === "End") nextIndex = options.length - 1;
        else if (event.key === "Escape") {
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

    return (
        <div className="relative" ref={containerRef}>
            <button
                aria-expanded={open}
                aria-haspopup="listbox"
                aria-label={ariaLabel}
                aria-controls={listboxId}
                className={
                    buttonClassName ??
                    "flex min-h-10 min-w-36 items-center justify-between gap-3 rounded-lg border border-stone-300 bg-white px-3 text-left text-sm text-stone-800 shadow-sm hover:bg-stone-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-800"
                }
                id={id}
                onClick={() => setOpen((current) => !current)}
                onKeyDown={openWithKeyboard}
                ref={triggerRef}
                type="button"
            >
                <span>{selectedOption?.label ?? "Choose an option"}</span>
                <svg aria-hidden="true" className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor">
                    <path d="m5.5 7.5 4.5 4.5 4.5-4.5" />
                </svg>
            </button>
            {open && (
                <div
                    className="absolute right-0 top-full z-40 mt-2 max-h-60 min-w-full w-max overflow-y-auto rounded-xl border border-stone-300 bg-white p-1 shadow-lg"
                    id={listboxId}
                    role="listbox"
                    aria-label={ariaLabel}
                >
                    {options.map((option, index) => (
                        <button
                            aria-selected={option.value === value}
                            className={`flex min-h-10 w-full items-center justify-between gap-4 rounded-lg px-3 py-2 text-left text-sm ${
                                option.value === value
                                    ? "bg-amber-50 font-semibold text-amber-900"
                                    : "text-stone-800 hover:bg-stone-100"
                            }`}
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
                            {option.value === value && <span aria-hidden="true">✓</span>}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
