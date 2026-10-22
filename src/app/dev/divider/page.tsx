import { DividerSection } from "@/components/Divider/divider";
import { DividerEditor } from "@/components/Divider/divider-editor";

import { PRESETS, presetToDividerStyle } from "@/theme/preset";

export default function DividerTest() {
    return (
        <main style={{ padding: 24 }}>
            <p>Editable (try the controls)</p>
            <DividerEditor />

            <p>Editable, starting Victorian</p>
            <DividerEditor initial={presetToDividerStyle(PRESETS.victorian)} />
            <p>Default (diamond)</p>
            <DividerSection style={{}} />

            <p>Medieval</p>
            <DividerSection style={presetToDividerStyle(PRESETS.medieval)} />

            <p>Draconian</p>
            <DividerSection style={presetToDividerStyle(PRESETS.draconian)} />

            <p>Invalid data (should fall back to defaults, not crash)</p>
            <DividerSection style={{ color: "red", thickness: 999 }} />
        </main>
    );
}