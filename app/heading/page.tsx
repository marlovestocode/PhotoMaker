import { HeadingSection } from "../components/Heading/HeadingSection";
import { HeadingEditor } from "../components/Heading/heading-editor";

export default function HeadingTest() {
    return (
        <main style={{ padding: 24 }}>
            <p>Editable (try the controls)</p>
            <HeadingEditor />

            <p>Default</p>
            <HeadingSection style={{}} />

            <p>Invalid data (should fall back to defaults, not crash)</p>
            <HeadingSection style={{ fontSize: "huge", color: "red" }} />
        </main>
    );
}