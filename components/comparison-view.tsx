"use client";

import { useState } from "react";
import { effectiveAxes, roleWeight } from "@/lib/axes";
import type { Family } from "@/lib/catalogue/types";
import { genericFor } from "@/lib/font-loader";
import { decodeAxes, encodeAxes } from "@/lib/lab-state";
import { useCatalogue } from "@/hooks/use-catalogue";
import { useParam } from "@/hooks/use-lab";
import { useLoadedFamily, type RoleFont } from "@/hooks/use-role-fonts";
import { AxisPanel } from "./axis-panel";
import { FamilyPicker } from "./family-picker";
import { SpringText } from "./spring-text";

/** Axes both sides understand the same way, which can be locked together. */
const SHARED = ["wght", "wdth", "opsz", "slnt"];

/**
 * Two faces side by side with one sample text and size. "Link axes" drives
 * the registered axes both families have from either side.
 */
export function ComparisonView({ left }: { left: RoleFont }) {
  const { byName, catalogue } = useCatalogue();
  const [otherName, setOtherName] = useParam("cmp", "Source Serif 4");
  const [otherRaw, setOtherRaw] = useParam("cmpv");
  const [linked, setLinked] = useParam("link", "1");
  const [text, setText] = useState("Sphinx of black quartz, judge my vow");
  const [size, setSize] = useState(40);
  const other: Family | undefined = byName.get(otherName);
  useLoadedFamily(other);

  const otherOverrides = decodeAxes(otherRaw);
  const setOther = (tag: string, value: number | undefined) => {
    const next = { ...otherOverrides };
    if (value === undefined) delete next[tag];
    else next[tag] = value;
    setOtherRaw(encodeAxes(next));
  };

  // Linked: shared axes on the right follow the left.
  const rightOverrides = { ...otherOverrides };
  if (linked === "1" && other) {
    for (const tag of SHARED) {
      if (left.axes[tag] !== undefined && other.axes.some((a) => a.tag === tag)) rightOverrides[tag] = left.axes[tag];
    }
  }
  const rightAxes = effectiveAxes(other, rightOverrides);
  const sides = [
    { name: left.name, css: left.css, axes: left.axes, weight: left.weight },
    { name: otherName, css: other ? `"${otherName}", ${genericFor(other)}` : "system-ui", axes: rightAxes, weight: roleWeight(other, rightOverrides) },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-4 text-xs">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label="Sample text"
          className="flex-1 min-w-[220px] bg-surface border border-border rounded-md px-3 py-1.5 text-sm"
        />
        <label className="flex items-center gap-2">
          <span className="text-muted">Size</span>
          <input type="range" min={14} max={120} value={size} onChange={(e) => setSize(Number(e.target.value))} />
          <span className="tabular-nums w-10">{size}px</span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" checked={linked === "1"} onChange={(e) => setLinked(e.target.checked ? "1" : "0")} />
          Link shared axes
        </label>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sides.map((s, i) => (
          <div key={i} className="flex flex-col gap-3">
            <span className="text-xs text-muted">{s.name}</span>
            <div className="border border-border rounded-lg p-6 min-h-[160px] flex items-center">
              <SpringText axes={s.axes} className="leading-tight break-words" style={{ fontFamily: s.css, fontWeight: s.weight, fontSize: size }}>
                {text}
              </SpringText>
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <p className="text-xs text-muted">The left side is the role being tuned; use the axis panel beside it.</p>
        <div className="flex flex-col gap-4">
          <FamilyPicker label="Compare with" value={otherName} onChange={(f) => { setOtherName(f); setOtherRaw(""); }} />
          {other && catalogue && (
            <AxisPanel
              family={other}
              registry={catalogue.axisRegistry}
              overrides={rightOverrides}
              onChange={setOther}
              onReset={() => setOtherRaw("")}
            />
          )}
        </div>
      </div>
    </div>
  );
}
