"use client";

import { PRESETS } from "../../theme/preset";

export function ThemePicker({
    presetKey,
    onChange,
}: {
    presetKey: keyof typeof PRESETS;
    onChange: (key: keyof typeof PRESETS) => void;
}) {
    return (
        <div style={{ display: "flex", gap: 8 }}>
            {Object.keys(PRESETS).map((key) => {
                const preset = PRESETS[key as keyof typeof PRESETS];
                return (
                    <button
                        key={key}
                        onClick={() => onChange(key as keyof typeof PRESETS)}
                        style={{
                            backgroundColor: presetKey === key ? "lightblue" : "white",
                            border: "1px solid #ccc",
                            padding: "8px 16px",
                            margin: "4px",
                        }}
                    >
                        {preset.name}
                    </button>
                );
            })}
        </div>
    );
}