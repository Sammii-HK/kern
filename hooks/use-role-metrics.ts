"use client";

import { useEffect, useState } from "react";
import { fallbackFace, measureFont, xHeightMatch, LOCAL_FALLBACKS, type FallbackFace, type FallbackKind, type FontMetrics } from "@/lib/metrics";
import type { Family } from "@/lib/catalogue/types";
import { ROLES, type LabState, type Role } from "@/lib/lab-state";
import type { RoleFont } from "./use-role-fonts";

export interface RoleMetrics {
  metrics: Partial<Record<Role, FontMetrics>>;
  fallbacks: Partial<Record<Role, FallbackFace>>;
  /** Font-size multiplier that sits the mono at the body's x-height. */
  monoScale?: number;
}

export function fallbackKind(family?: Family): FallbackKind {
  if (!family) return "sans";
  if (family.mono) return "mono";
  if (family.category === "serif" || family.stroke === "serif" || family.stroke === "slab") return "serif";
  return "sans";
}

/**
 * Measures each role once its font has loaded, and derives fallbacks. Each
 * role is measured at a size it is actually used at (`sizes`), so families
 * with an opsz axis report the cut that will be on screen.
 */
export function useRoleMetrics(
  roles: Record<Role, RoleFont>,
  sizes: Record<Role, number> = { heading: 48, body: 16, mono: 16 }
): RoleMetrics {
  const [result, setResult] = useState<RoleMetrics>({ metrics: {}, fallbacks: {} });
  const key =
    ROLES.map((r) => `${roles[r].name}:${roles[r].fvs}:${roles[r].weight}:${roles[r].status}`).join("|") +
    `|${sizes.heading}:${sizes.body}:${sizes.mono}`;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const metrics: RoleMetrics["metrics"] = {};
      const fallbacks: RoleMetrics["fallbacks"] = {};
      for (const role of ROLES) {
        const rf = roles[role];
        if (rf.status !== "ready") continue;
        // Make sure the exact weight is ready before measuring, not just the default.
        try {
          await document.fonts.load(`${rf.weight} ${sizes[role]}px "${rf.name}"`, "xHg");
        } catch {
          continue;
        }
        const m = measureFont(`"${rf.name}", monospace`, { weight: rf.weight, size: sizes[role] });
        if (!m || !m.xHeight) continue;
        metrics[role] = m;
        const kind = fallbackKind(rf.family);
        const local = measureFont(`"${LOCAL_FALLBACKS[kind]}"`, {
          weight: rf.weight >= 600 ? 700 : 400,
          size: sizes[role],
        });
        if (local) fallbacks[role] = fallbackFace(rf.name, m, local, kind);
      }
      const monoScale =
        metrics.body && metrics.mono ? xHeightMatch(metrics.body, metrics.mono) : undefined;
      if (!cancelled) setResult({ metrics, fallbacks, monoScale });
    })();
    return () => {
      cancelled = true;
    };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  return result;
}

/** Sizes to measure at: the body base, and a mid-size heading step, at the large viewport. */
export function roleSizes(state: LabState): Record<Role, number> {
  const { maxBase, maxRatio, stepsUp } = state.scale;
  const headingStep = Math.min(stepsUp, Math.max(state.headingFrom, 0) + 2);
  return {
    heading: Math.round(maxBase * Math.pow(maxRatio, headingStep)),
    body: Math.round(maxBase),
    mono: Math.round(maxBase),
  };
}
