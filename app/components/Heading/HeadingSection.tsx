import { headingStyleSchema, headingStyleToCssVars } from "@/app/theme/heading-style";
import type { CSSProperties } from "react";

export function HeadingSection({ style }: { style: unknown }) {
    const parsed = headingStyleSchema.safeParse(style ?? {});
    const s = parsed.success ? parsed.data : headingStyleSchema.parse({});

    const headingStyle = {
        ...headingStyleToCssVars(s),
        fontSize: "var(--h-font-size)",
        fontWeight: "var(--h-font-weight)",
        textAlign: "var(--h-text-align)",
        color: "var(--h-color)",
    } as unknown as CSSProperties;

    return (
        <h1 style={headingStyle}>{s.text}</h1>
    );
}