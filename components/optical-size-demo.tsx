"use client";

import { type FontConfig, buildFontVariationSettings } from "@/lib/fonts";

interface OpticalSizeDemoProps {
  font: FontConfig;
  axisValues: Record<string, number>;
}

export function OpticalSizeDemo({ font, axisValues }: OpticalSizeDemoProps) {
  const opszAxis = font.axes.find((a) => a.tag === "opsz");
  if (!opszAxis) return null;

  const withOpsz = buildFontVariationSettings(font.axes, axisValues);
  const withoutOpsz = buildFontVariationSettings(font.axes, {
    ...axisValues,
    opsz: opszAxis.min,
  });

  return (
    <div className="border border-border rounded-lg p-6">
      <h4 className="text-xs uppercase tracking-wider text-muted mb-4 font-medium">
        Optical Size Comparison
      </h4>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <p className="text-[10px] text-muted mb-2 uppercase tracking-wider">
            opsz: {axisValues.opsz ?? opszAxis.default}
          </p>
          <p
            className="text-2xl leading-relaxed"
            style={{
              fontFamily: font.family,
              fontVariationSettings: withOpsz,
            }}
          >
            Hamburgevons
          </p>
        </div>
        <div>
          <p className="text-[10px] text-muted mb-2 uppercase tracking-wider">
            opsz: {opszAxis.min} (off)
          </p>
          <p
            className="text-2xl leading-relaxed"
            style={{
              fontFamily: font.family,
              fontVariationSettings: withoutOpsz,
            }}
          >
            Hamburgevons
          </p>
        </div>
      </div>
    </div>
  );
}
