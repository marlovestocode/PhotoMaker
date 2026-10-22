import { imageStyleSchema, imageStyleToCssVars } from "@/theme/image-style";
import type { CSSProperties } from "react";

export function ImageSection({ style }: { style: unknown }) {
    const parsed = imageStyleSchema.safeParse(style ?? {});
    const s = parsed.success ? parsed.data : imageStyleSchema.parse({});

    return (
        <figure style={{ margin: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                alt={s.alt}
                decoding="async"
                loading="lazy"
                src={s.src}
                style={{
                    ...imageStyleToCssVars(s),
                    borderRadius: "var(--img-border-radius)",
                    maxWidth: "var(--img-max-width)",
                    display: "block",
                } as CSSProperties}
            />
            {s.caption && (
                <figcaption
                    style={{
                        color: "var(--site-muted, inherit)",
                        fontSize: "var(--site-body-size, 14px)",
                        marginTop: 8,
                    }}
                >
                    {s.caption}
                </figcaption>
            )}
        </figure>
    );
}
