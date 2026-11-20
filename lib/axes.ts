import type { AxisInfo, Family, FamilyAxis } from "./catalogue/types";

/** Display info for an axis, from the registry where it is registered. */
export function axisInfo(axis: FamilyAxis, registry: Record<string, AxisInfo>) {
  const reg = registry[axis.tag];
  const span = axis.max - axis.min;
  const step = reg?.step ?? (span <= 2 ? 0.01 : 1);
  return {
    name: reg?.name ?? axis.tag,
    description: reg?.description ?? "A custom axis defined by this family.",
    // Never offer fewer than about 20 positions on a slider.
    step: Math.min(step, span / 20 >= 1 ? 1 : step),
  };
}

/**
 * Axis values to render for a family: its defaults overridden by the user's
 * choices. opsz is left out unless explicitly set, so the browser's
 * font-optical-sizing: auto keeps it tied to the rendered size.
 */
export function effectiveAxes(
  family: Pick<Family, "axes"> | undefined,
  overrides: Record<string, number> = {}
): Record<string, number> {
  const out: Record<string, number> = {};
  if (!family) return out;
  for (const axis of family.axes) {
    const value = overrides[axis.tag];
    if (axis.tag === "opsz" && value === undefined) continue;
    out[axis.tag] = clamp(value ?? axis.default, axis.min, axis.max);
  }
  return out;
}

export function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

export function fvsString(values: Record<string, number>): string {
  const entries = Object.entries(values);
  if (!entries.length) return "normal";
  return entries.map(([tag, v]) => `"${tag}" ${+v.toFixed(2)}`).join(", ");
}

/** The weight a role renders at: its wght axis, or the nearest static weight. */
export function roleWeight(family: Family | undefined, overrides: Record<string, number>): number {
  if (!family) return 400;
  const wght = family.axes.find((a) => a.tag === "wght");
  if (wght) return clamp(overrides.wght ?? wght.default, wght.min, wght.max);
  const want = overrides.wght ?? 400;
  return family.weights.reduce(
    (best, w) => (Math.abs(w - want) < Math.abs(best - want) ? w : best),
    family.weights[0] ?? 400
  );
}

export function hasAxis(family: Family | undefined, tag: string) {
  return !!family?.axes.some((a) => a.tag === tag);
}
