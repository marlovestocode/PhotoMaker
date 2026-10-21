import { dividerStyleSchema, styleToCssVars } from "../../theme/divider-style";

const ORNAMENTS = { none: "", diamond: "◆", dots: "• • •", fleuron: "❦" };

export function DividerSection({ style }: { style: unknown }) {
  // Re-validate stored styles at render time; bad data falls back to defaults
  const parsed = dividerStyleSchema.safeParse(style ?? {});
  const s = parsed.success ? parsed.data : dividerStyleSchema.parse({});
  const mark = ORNAMENTS[s.ornament];

  const line = {
    flex: 1,
    height: "var(--d-thickness)",
    background: "var(--d-color)",
    borderRadius: 999,
  } as const;

  return (
    <div
      role="separator"
      style={{
        ...styleToCssVars(s),
        width: "var(--d-width)",
        margin: "var(--d-spacing) auto",
        display: "flex",
        alignItems: "center",
        gap: 16,
        color: "var(--d-color)",
        opacity: "var(--d-opacity)",
      }}
    >
      <span style={line} />
      {mark && <span aria-hidden style={{ fontSize: 20 }}>{mark}</span>}
      {mark && <span style={line} />}
    </div>
  );
}