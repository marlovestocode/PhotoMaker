import { DividerSection } from "../components/Divider/divider";
import { DividerEditor } from "../components/Divider/divider-editor";

import { PRESETS, presetToDividerStyle } from "../theme/preset";

export default function DividerTest() {
    return (
        <main style={{ padding: 24 }}>
            <p>Editable (try the controls)</p>
            <DividerEditor />

            <p>Editable, starting Victorian</p>
            <DividerEditor initial={presetToDividerStyle(PRESETS.victorian)} />
            <p>Default (diamond)</p>
            <DividerSection style={{}} />

            <p>Victorian-ish</p>
            <DividerSection
                style={presetToDividerStyle(PRESETS.victorian)}
            />

            <p>Dots, thin</p>
            <DividerSection style={{ color: "#444444", thickness: 1, ornament: "dots" }} />

            <p>No ornament</p>
            <DividerSection style={{ ornament: "none", color: "#2a5b4a" }} />

            <p>Invalid data (should fall back to defaults, not crash)</p>
            <DividerSection style={{ color: "red", thickness: 999 }} />
        </main>
    );
}