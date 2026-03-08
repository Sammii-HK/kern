"use client";

import { type FontConfig } from "@/lib/fonts";
import { AxisSlider } from "./axis-slider";

interface AxisPanelProps {
  font: FontConfig;
  values: Record<string, number>;
  onChange: (tag: string, value: number) => void;
  onReset: () => void;
}

export function AxisPanel({ font, values, onChange, onReset }: AxisPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{font.name}</h3>
        <button
          onClick={onReset}
          className="text-xs text-muted hover:text-foreground transition-colors"
        >
          Reset
        </button>
      </div>
      {font.axes.map((axis) => (
        <AxisSlider
          key={axis.tag}
          axis={axis}
          value={values[axis.tag] ?? axis.default}
          onChange={onChange}
        />
      ))}
    </div>
  );
}
