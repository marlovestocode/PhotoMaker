"use client";

import {useState} from "react";
import { headingStyleSchema, type HeadingStyle } from "../../theme/heading-style";
import { HeadingSection } from "../landing/HeadingSection";

const DEFAULTS = headingStyleSchema.parse({});

export function HeadingEditor({ initial }: { initial?: Partial<HeadingStyle> }) {
  const [style, setStyle] = useState<HeadingStyle>({ ...DEFAULTS, ...initial });

    const set = <K extends keyof HeadingStyle>(key: K, value: HeadingStyle[K]) => {
        setStyle((prev) => ({ ...prev, [key]: value }));
    };

    const row = { display: "flex", alignItems: "center", gap: 12, marginBottom: 14 } as const;
    const label = { width: 90, fontSize: 14 } as const;

    return (
        <div style={{ border: "1px solid #ccc", borderRadius: 12, padding: 16, marginBottom: 32 }}>
            <HeadingSection style={style} />
            <div style={row}>
                <span style={label}>Text</span>
                <input
                    type="text"
                    value={style.text}
                    onChange={(e) => set("text", e.target.value)}
                    style={{ flex: 1 }}
                />
            </div>
            <div style={row}>
                <span style={label}>Font Size</span>
                <input type="number" min={12} max={72} value={style.fontSize}
                    onChange={(e) => set("fontSize", Number(e.target.value))}
                    style={{ flex: 1 }}
                />
                <span>{style.fontSize}px</span>
            </div>
                    
        </div>
    );
}