"use client";

import { type ScaleStep } from "@/lib/scales";
import { GripVertical } from "lucide-react";

interface ViewportPreviewProps {
  steps: ScaleStep[];
  fontFamily?: string;
}

export function ViewportPreview({ steps, fontFamily }: ViewportPreviewProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-xs text-muted">
        <GripVertical size={14} />
        <span>Drag right edge to resize</span>
      </div>
      <div className="resize-container">
        {[...steps].reverse().map((step) => (
          <p
            key={step.label}
            className="leading-snug mb-2"
            style={{ fontSize: step.clamp, fontFamily }}
          >
            {step.label}: The quick brown fox
          </p>
        ))}
      </div>
    </div>
  );
}
