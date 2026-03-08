"use client";

import { scaleRatios, type ScaleRatioName } from "@/lib/scales";

interface ScaleConfigProps {
  baseSize: number;
  ratio: ScaleRatioName;
  steps: number;
  minVw: number;
  maxVw: number;
  onBaseSizeChange: (v: number) => void;
  onRatioChange: (v: ScaleRatioName) => void;
  onStepsChange: (v: number) => void;
  onMinVwChange: (v: number) => void;
  onMaxVwChange: (v: number) => void;
}

export function ScaleConfig({
  baseSize,
  ratio,
  steps,
  minVw,
  maxVw,
  onBaseSizeChange,
  onRatioChange,
  onStepsChange,
  onMinVwChange,
  onMaxVwChange,
}: ScaleConfigProps) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold">Configuration</h3>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs text-muted uppercase tracking-wider">
          Base size (px)
        </span>
        <input
          type="number"
          min={8}
          max={32}
          value={baseSize}
          onChange={(e) => onBaseSizeChange(Number(e.target.value))}
          className="bg-surface border border-border rounded-md px-3 py-1.5 text-sm tabular-nums"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs text-muted uppercase tracking-wider">
          Scale ratio
        </span>
        <select
          value={ratio}
          onChange={(e) => onRatioChange(e.target.value as ScaleRatioName)}
          className="bg-surface border border-border rounded-md px-3 py-1.5 text-sm"
        >
          {Object.entries(scaleRatios).map(([name, val]) => (
            <option key={name} value={name}>
              {name} ({val})
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs text-muted uppercase tracking-wider">
          Steps
        </span>
        <input
          type="number"
          min={4}
          max={10}
          value={steps}
          onChange={(e) => onStepsChange(Number(e.target.value))}
          className="bg-surface border border-border rounded-md px-3 py-1.5 text-sm tabular-nums"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-muted uppercase tracking-wider">
            Min viewport (px)
          </span>
          <input
            type="number"
            min={320}
            max={768}
            step={10}
            value={minVw}
            onChange={(e) => onMinVwChange(Number(e.target.value))}
            className="bg-surface border border-border rounded-md px-3 py-1.5 text-sm tabular-nums"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-muted uppercase tracking-wider">
            Max viewport (px)
          </span>
          <input
            type="number"
            min={1024}
            max={1920}
            step={10}
            value={maxVw}
            onChange={(e) => onMaxVwChange(Number(e.target.value))}
            className="bg-surface border border-border rounded-md px-3 py-1.5 text-sm tabular-nums"
          />
        </label>
      </div>
    </div>
  );
}
