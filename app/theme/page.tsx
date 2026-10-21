"use client";

import { useState } from "react";
import { ThemePicker } from "../components/Theme/theme-picker";
import { DividerSection } from "../components/Divider/divider";
import { HeadingSection } from "../components/Heading/HeadingSection";
import { PRESETS, presetToDividerStyle, presetToHeadingStyle } from "../theme/preset";

export default function ThemeTest() {
    const [presetKey, setPresetKey] = useState<keyof typeof PRESETS>("victorian");
    const preset = PRESETS[presetKey];

    return (
        <main style={{ padding: 24 }}>
            <ThemePicker presetKey={presetKey} onChange={setPresetKey} />
            <HeadingSection style={presetToHeadingStyle(preset)} />
            <DividerSection style={presetToDividerStyle(preset)} />
        </main>
    );
}