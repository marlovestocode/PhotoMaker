"use client";

import { useState } from "react";
import { CustomDropdown } from "../ui/custom-dropdown";
import { dividerStyleSchema, type DividerStyle } from "../../theme/divider-style";
import { DividerSection } from "./divider";

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
        <span style={label}>Opacity</span>
        <input
          type="range" min={0} max={1} step={0.1} value={style.opacity}
          onChange={(e) => set("opacity", Number(e.target.value))}
          style={{ flex: 1 }}
        />
        <span>{style.opacity}</span>
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
        <CustomDropdown<DividerStyle["ornament"]>
          ariaLabel="Ornament"
          buttonClassName="min-h-10 flex-1 rounded-lg border border-stone-300 bg-white px-3 text-left"
          value={style.ornament}
          onChange={(value) => set("ornament", value)}
          options={[
            { value: "none", label: "None" },
            { value: "diamond", label: "Diamond" },
            { value: "dots", label: "Dots" },
            { value: "fleuron", label: "Fleuron" },
          ]}
        />
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