"use client";

import type { ChangeEvent } from "react";

export function CheckmarkCheckbox({
    checked,
    className = "",
    label,
    onChange,
}: {
    checked: boolean;
    className?: string;
    label: string;
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
    return (
        <label className={`inline-flex cursor-pointer select-none items-center gap-2 ${className}`}>
            <input
                aria-label={label}
                checked={checked}
                className="custom-checkmark-input sr-only"
                onChange={onChange}
                type="checkbox"
            />
            <span aria-hidden="true" className="custom-checkmark">
                <svg fill="none" viewBox="0 0 20 20">
                    <path
                        d="m4.5 10.25 3.7 3.7 7.3-7.7"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2.5"
                    />
                </svg>
            </span>
            <span>{label}</span>
        </label>
    );
}
