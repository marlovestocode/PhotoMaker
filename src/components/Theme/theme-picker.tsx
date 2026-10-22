"use client";

import { PRESETS } from "@/theme/preset";

export function ThemePicker({
    presetKey,
    onChange,
}: {
    presetKey: keyof typeof PRESETS;
    onChange: (key: keyof typeof PRESETS) => void;
}) {
    return (
        <div className="flex flex-wrap gap-2">
            {Object.entries(PRESETS).map(([key, preset]) => (
                <button
                    className={`min-h-10 rounded-lg border px-4 text-sm font-medium ${
                        presetKey === key
                            ? "border-[var(--site-accent)] bg-[var(--site-accent)] text-white"
                            : "border-stone-300 bg-white text-stone-800 hover:bg-stone-50"
                    }`}
                    key={key}
                    onClick={() => onChange(key as keyof typeof PRESETS)}
                    type="button"
                >
                    {preset.name}
                </button>
            ))}
        </div>
    );
}
