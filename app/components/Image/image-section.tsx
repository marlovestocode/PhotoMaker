import { imageStyleSchema, imageStyleToCssVars, type ImageStyle } from "../../theme/image-style";
import type { CSSProperties } from "react";

export function ImageSection({ style }: { style: unknown }) {
    const parsed = imageStyleSchema.safeParse(style ?? {});
    const s = parsed.success ? parsed.data : imageStyleSchema.parse({});

    const imgStyle = {
        ...imageStyleToCssVars(s),
        borderRadius: "var(--img-border-radius)",
        maxWidth: "var(--img-max-width)",
        display: "block",
    } as unknown as CSSProperties;

    return (
        <figure style={{ margin: 0 }}>
            <img src={s.src} alt={s.alt} style={imgStyle} />
            {s.caption && <figcaption style={{ fontSize: 14, marginTop: 8 }}>{s.caption}</figcaption>}
        </figure>
    );
}