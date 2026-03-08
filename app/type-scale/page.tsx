"use client";

import { useState } from "react";
import {
  scaleRatios,
  generateScale,
  generateCssOutput,
  type ScaleRatioName,
} from "@/lib/scales";
import { fonts } from "@/lib/fonts";
import { ScaleConfig } from "@/components/scale-config";
import { TypeScaleVisualiser } from "@/components/type-scale-visualiser";
import { ViewportPreview } from "@/components/viewport-preview";
import { CopyButton } from "@/components/copy-button";

export default function TypeScalePage() {
  const [baseSize, setBaseSize] = useState(16);
  const [ratio, setRatio] = useState<ScaleRatioName>("Perfect Fourth");
  const [steps, setSteps] = useState(8);
  const [minVw, setMinVw] = useState(375);
  const [maxVw, setMaxVw] = useState(1440);
  const [fontIndex, setFontIndex] = useState(0);

  const scale = generateScale({
    baseSize,
    ratio: scaleRatios[ratio],
    minVw,
    maxVw,
    steps,
  });

  const cssOutput = generateCssOutput(scale);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Type Scale
        </h1>
        <p className="text-muted text-sm max-w-lg">
          Generate a fluid type scale with clamp() values. Configure the ratio,
          base size, and viewport range, then copy the CSS.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
        {/* Sidebar */}
        <aside className="flex flex-col gap-6 lg:sticky lg:top-20 lg:self-start">
          <ScaleConfig
            baseSize={baseSize}
            ratio={ratio}
            steps={steps}
            minVw={minVw}
            maxVw={maxVw}
            onBaseSizeChange={setBaseSize}
            onRatioChange={setRatio}
            onStepsChange={setSteps}
            onMinVwChange={setMinVw}
            onMaxVwChange={setMaxVw}
          />

          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted uppercase tracking-wider font-medium">
              Preview font
            </span>
            <select
              value={fontIndex}
              onChange={(e) => setFontIndex(Number(e.target.value))}
              className="bg-surface border border-border rounded-md px-3 py-1.5 text-sm"
            >
              {fonts.map((f, i) => (
                <option key={f.name} value={i}>
                  {f.name}
                </option>
              ))}
            </select>
          </label>

          <CopyButton text={cssOutput} label="Copy CSS Variables" />
        </aside>

        {/* Main */}
        <div className="flex flex-col gap-8">
          <TypeScaleVisualiser
            steps={scale}
            fontFamily={fonts[fontIndex].family}
          />

          <ViewportPreview
            steps={scale}
            fontFamily={fonts[fontIndex].family}
          />

          {/* CSS output */}
          <div className="border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs uppercase tracking-wider text-muted font-medium">
                CSS Variables
              </h4>
              <CopyButton text={cssOutput} label="Copy" />
            </div>
            <pre className="text-sm font-mono text-foreground/80 whitespace-pre-wrap">
              {cssOutput}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
