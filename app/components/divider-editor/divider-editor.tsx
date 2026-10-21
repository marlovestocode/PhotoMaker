"use client";

import { useState } from "react";
import { dividerStyleSchema, type DividerStyle } from "../../theme/section-style";
import { DividerSection } from "../landing-sections/divider";

const DEFAULTS = dividerStyleSchema.parse({});

export function DividerEditor({ initial }: { initial?: Partial<DividerStyle> }) {
  const [style, setStyle] = useState<DividerStyle>({ ...DEFAULTS, ...initial });

  const set = <K extends keyof DividerStyle>(key: K, value: DividerStyle[K]) =>
    setStyle((prev) => ({ ...prev, [key]: value }));

  const row = { display: "flex", alignItems: "center", gap: 12, marginBottom: 14 } as const;
  const label = { width: 90, fontSize: 14 } as const;

  return (
    <div style={{ border: "1px solid #ccc", borderRadius: 12, padding: 16, marginBottom: 32 }}>
      <DividerSection style={style} />

      <div style={row}>
        <span style={label}>Color</span>
        <input
          type="color"
          value={style.color}
          onChange={(e) => set("color", e.target.value)}
          style={{ width: 48, height: 40 }}
        />
      </div>

      <div style={row}>
        <span style={label}>Thickness</span>
        <input
          type="range" min={1} max={8} value={style.thickness}
          onChange={(e) => set("thickness", Number(e.target.value))}
          style={{ flex: 1 }}
        />
        <span>{style.thickness}px</span>
      </div>

      <div style={row}>
        <span style={label}>Width</span>
        <input
          type="range" min={20} max={100} value={style.width}
          onChange={(e) => set("width", Number(e.target.value))}
          style={{ flex: 1 }}
        />
        <span>{style.width}%</span>
      </div>

      <div style={row}>
        <span style={label}>Spacing</span>
        <input
          type="range" min={0} max={120} value={style.spacing}
          onChange={(e) => set("spacing", Number(e.target.value))}
          style={{ flex: 1 }}
        />
        <span>{style.spacing}px</span>
      </div>

      <div style={row}>
        <span style={label}>Ornament</span>
        <select
          value={style.ornament}
          onChange={(e) => set("ornament", e.target.value as DividerStyle["ornament"])}
          style={{ flex: 1, height: 40, fontSize: 16 }}
        >
          <option value="none">None</option>
          <option value="diamond">Diamond</option>
          <option value="dots">Dots</option>
          <option value="fleuron">Fleuron</option>
        </select>
      </div>

      <button
        onClick={() => setStyle(DEFAULTS)}
        style={{ height: 44, padding: "0 20px", fontSize: 16 }}
      >
        Reset
      </button>

      <pre style={{ fontSize: 12, marginTop: 16, opacity: 0.7 }}>
        {JSON.stringify(style, null, 2)}
      </pre>
    </div>
  );
}