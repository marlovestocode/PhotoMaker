"use client";

import { useState } from "react";
import { PRESETS, type Preset } from "./preset";

export function usePresetSelection(defaultKey: keyof typeof PRESETS = "victorian") {
    const [presetKey, setPresetKey] = useState<keyof typeof PRESETS>(defaultKey);
    const preset: Preset = PRESETS[presetKey]

    return { presetKey, setPresetKey, preset }
}