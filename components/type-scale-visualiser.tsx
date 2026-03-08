"use client";

import { type ScaleStep } from "@/lib/scales";

interface TypeScaleVisualiserProps {
  steps: ScaleStep[];
  fontFamily?: string;
}

export function TypeScaleVisualiser({
  steps,
  fontFamily,
}: TypeScaleVisualiserProps) {
  return (
    <div className="flex flex-col gap-0">
      {[...steps].reverse().map((step) => (
        <div
          key={step.label}
          className="flex items-baseline gap-4 py-3 border-b border-border/50 group"
        >
          <div className="flex-shrink-0 w-16 text-right">
            <span className="text-xs text-muted tabular-nums font-mono">
              {step.label}
            </span>
          </div>
          <div className="flex-shrink-0 w-20 text-right">
            <span className="text-[10px] text-muted tabular-nums font-mono">
              {step.px}px / {step.rem}rem
            </span>
          </div>
          <p
            className="leading-none transition-all duration-200"
            style={{
              fontSize: step.clamp,
              fontFamily,
            }}
          >
            Aa
          </p>
        </div>
      ))}
    </div>
  );
}
