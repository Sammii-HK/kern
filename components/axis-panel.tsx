"use client";

import { axisInfo, clamp } from "@/lib/axes";
import type { AxisInfo, Family } from "@/lib/catalogue/types";
import { cn } from "@/lib/utils";
import { AxisSlider } from "./axis-slider";

interface AxisPanelProps {
  family: Family;
  registry: Record<string, AxisInfo>;
  overrides: Record<string, number>;
  onChange: (tag: string, value: number | undefined) => void;
  onReset: () => void;
  title?: string;
}

/**
 * Controls generated from the family's metadata: one slider per variable
 * axis, named and stepped from the axis registry, or a weight picker for
 * static families.
 */
export function AxisPanel({ family, registry, overrides, onChange, onReset, title }: AxisPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title ?? family.family}</h3>
        <button onClick={onReset} className="text-xs text-muted hover:text-foreground transition-colors">
          Reset
        </button>
      </div>

      {family.axes.length === 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted">
            Static family: {family.weights.length} weight{family.weights.length === 1 ? "" : "s"}, no variable axes.
          </p>
          <div className="flex flex-wrap gap-1">
            {family.weights.map((w) => {
              const active = (overrides.wght ?? 400) === w;
              return (
                <button
                  key={w}
                  onClick={() => onChange("wght", w === 400 ? undefined : w)}
                  className={cn(
                    "px-2 py-1 text-xs rounded border tabular-nums",
                    active ? "bg-foreground text-background border-foreground" : "border-border text-muted hover:text-foreground"
                  )}
                >
                  {w}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        family.axes.map((axis) => {
          const info = axisInfo(axis, registry);
          const isOpsz = axis.tag === "opsz";
          const auto = isOpsz && overrides.opsz === undefined;
          const value = clamp(overrides[axis.tag] ?? axis.default, axis.min, axis.max);
          return (
            <AxisSlider
              key={axis.tag}
              tag={axis.tag}
              name={info.name}
              description={info.description}
              min={axis.min}
              max={axis.max}
              step={info.step}
              value={value}
              disabled={auto}
              onChange={(v) => onChange(axis.tag, v)}
              aside={
                isOpsz ? (
                  <label className="flex min-h-11 min-w-11 items-center justify-center gap-1 text-[10px] text-muted cursor-pointer">
                    <input
                      type="checkbox"
                      checked={auto}
                      onChange={(e) => onChange("opsz", e.target.checked ? undefined : axis.default)}
                      className="accent-current"
                    />
                    auto
                  </label>
                ) : undefined
              }
            />
          );
        })
      )}
    </div>
  );
}
