"use client";

import type { Family } from "@/lib/catalogue/types";
import type { RoleFont } from "@/hooks/use-role-fonts";
import { SpringText } from "./spring-text";

const SIZES = [12, 24, 48, 96];

/**
 * The same word at several sizes, once with opsz following the size and once
 * pinned to the axis minimum, so the difference optical sizing makes is visible.
 */
export function OpticalSizeDemo({ font, family }: { font: RoleFont; family?: Family }) {
  const axis = family?.axes.find((a) => a.tag === "opsz");
  if (!axis) return null;
  const clamp = (n: number) => Math.min(axis.max, Math.max(axis.min, n));
  return (
    <div className="border border-border rounded-lg p-6 flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <h4 className="text-xs uppercase tracking-wider text-muted font-medium">Optical size</h4>
        <span className="text-[11px] text-muted">
          opsz {axis.min} to {axis.max}
        </span>
      </div>
      <div className="grid grid-cols-[auto_1fr_1fr] gap-x-6 gap-y-2 items-baseline">
        <span />
        <span className="text-[10px] text-muted uppercase tracking-wider">opsz = size</span>
        <span className="text-[10px] text-muted uppercase tracking-wider">opsz = {axis.min}</span>
        {SIZES.map((size) => (
          <div key={size} className="contents">
            <span className="text-[10px] text-muted tabular-nums">{size}px</span>
            {[clamp(size), axis.min].map((opsz, i) => (
              <SpringText
                key={i}
                axes={{ ...font.axes, opsz }}
                className="leading-tight truncate"
                style={{ fontFamily: font.css, fontWeight: font.weight, fontSize: size }}
              >
                Hamburg
              </SpringText>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
