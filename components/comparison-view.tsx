"use client";

import { fonts, getDefaultAxisValues, buildFontVariationSettings } from "@/lib/fonts";
import { AxisPanel } from "./axis-panel";
import { useState } from "react";

export function ComparisonView() {
  const [leftFont, setLeftFont] = useState(fonts[0]);
  const [rightFont, setRightFont] = useState(fonts[1]);
  const [leftValues, setLeftValues] = useState(getDefaultAxisValues(leftFont.axes));
  const [rightValues, setRightValues] = useState(getDefaultAxisValues(rightFont.axes));

  const sampleText = "The quick brown fox jumps over the lazy dog";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[
        { font: leftFont, values: leftValues, setValues: setLeftValues, setFont: setLeftFont },
        { font: rightFont, values: rightValues, setValues: setRightValues, setFont: setRightFont },
      ].map((side, i) => (
        <div key={i} className="flex flex-col gap-4">
          <select
            value={side.font.name}
            onChange={(e) => {
              const f = fonts.find((ff) => ff.name === e.target.value)!;
              side.setFont(f);
              side.setValues(getDefaultAxisValues(f.axes));
            }}
            className="text-sm bg-surface border border-border rounded-md px-3 py-1.5"
          >
            {fonts.map((f) => (
              <option key={f.name} value={f.name}>
                {f.name}
              </option>
            ))}
          </select>
          <div
            className="border border-border rounded-lg p-6 min-h-[160px] flex items-center"
          >
            <p
              className="text-3xl leading-relaxed break-words transition-[font-variation-settings] duration-200 ease-out"
              style={{
                fontFamily: side.font.family,
                fontVariationSettings: buildFontVariationSettings(
                  side.font.axes,
                  side.values
                ),
              }}
            >
              {sampleText}
            </p>
          </div>
          <AxisPanel
            font={side.font}
            values={side.values}
            onChange={(tag, val) =>
              side.setValues((prev) => ({ ...prev, [tag]: val }))
            }
            onReset={() => side.setValues(getDefaultAxisValues(side.font.axes))}
          />
        </div>
      ))}
    </div>
  );
}
