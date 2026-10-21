import { DividerSection } from "../components/landing-sections/divider";
import { DividerEditor } from "../components/divider-editor/divider-editor";

export default function DividerTest() {
    return (
        <main style={{ padding: 24 }}>
            <p>Editable (try the controls)</p>
            <DividerEditor />

            <p>Editable, starting Victorian</p>
            <DividerEditor initial={{ color: "#5b2a2a", thickness: 3, ornament: "fleuron", width: 60 }} />
            <p>Default (diamond)</p>
            <DividerSection style={{}} />

            <p>Victorian-ish</p>
            <DividerSection
                style={{ color: "#5b2a2a", thickness: 3, ornament: "fleuron", width: 60 }}
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