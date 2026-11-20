import type { CSSProperties } from "react";
import type { RoleFont } from "@/hooks/use-role-fonts";
import type { Role } from "./lab-state";
import { ROLES } from "./lab-state";
import { clampFor, lineHeightValue, stepName, trackingValue, type Step } from "./scale";

/**
 * CSS custom properties for rendering the system inside a preview. Steps use
 * cqi so they respond to the preview's width rather than the window's.
 */
export function systemStyle(
  roles: Record<Role, RoleFont>,
  steps: Step[],
  { unit = "cqi", monoScale = 1 }: { unit?: "cqi" | "vw"; monoScale?: number } = {}
): CSSProperties {
  const vars: Record<string, string | number> = {};
  for (const role of ROLES) {
    const rf = roles[role];
    vars[`--font-${role}`] = rf.css;
    vars[`--font-${role}-weight`] = rf.weight;
    vars[`--font-${role}-fvs`] = rf.fvs;
  }
  vars["--font-mono-scale"] = monoScale;
  for (const step of steps) {
    const n = stepName(step.step);
    vars[`--${n}`] = clampFor(step, unit);
    vars[`--${n}-lh`] = lineHeightValue(step);
    vars[`--${n}-tr`] = trackingValue(step);
  }
  return vars as CSSProperties;
}

/** Inline style for text set at a scale step in a role. */
export function textStyle(step: number, role: Role = "body"): CSSProperties {
  const n = stepName(step);
  return {
    fontFamily: `var(--font-${role})`,
    fontWeight: `var(--font-${role}-weight)` as unknown as number,
    fontVariationSettings: `var(--font-${role}-fvs)`,
    fontSize: `var(--${n})`,
    lineHeight: `var(--${n}-lh)`,
    letterSpacing: `var(--${n}-tr)`,
  };
}

export function monoStyle(): CSSProperties {
  return {
    fontFamily: "var(--font-mono)",
    fontWeight: "var(--font-mono-weight)" as unknown as number,
    fontVariationSettings: "var(--font-mono-fvs)",
    fontSize: "calc(1em * var(--font-mono-scale))",
  };
}
