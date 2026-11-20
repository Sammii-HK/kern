/*
 * Fluid type scale, Utopia style: a base size and ratio at the smallest
 * viewport, another pair at the largest, and each step interpolates linearly
 * between the two. Everything is kept at full precision and rounded once, in
 * the output formatters at the bottom.
 */

export const RATIOS = {
  "Minor second": 1.067,
  "Major second": 1.125,
  "Minor third": 1.2,
  "Major third": 1.25,
  "Perfect fourth": 1.333,
  "Augmented fourth": 1.414,
  "Perfect fifth": 1.5,
  "Golden ratio": 1.618,
} as const;

export interface ScaleConfig {
  minViewport: number;
  maxViewport: number;
  minBase: number;
  maxBase: number;
  minRatio: number;
  maxRatio: number;
  stepsUp: number;
  stepsDown: number;
}

export const DEFAULT_SCALE: ScaleConfig = {
  minViewport: 360,
  maxViewport: 1240,
  minBase: 17,
  maxBase: 20,
  minRatio: 1.2,
  maxRatio: 1.25,
  stepsUp: 5,
  stepsDown: 2,
};

export interface Step {
  step: number;
  /** px at the smallest viewport. */
  min: number;
  /** px at the largest viewport. */
  max: number;
  /** px per px of viewport width. */
  slope: number;
  /** px at a 0px viewport, the constant term of the line. */
  intercept: number;
  lineHeight: number;
  /** em, negative means tighter. */
  tracking: number;
}

/**
 * Leading as the font size plus a fixed gap of half the base size. Body text
 * lands on 1.5 and large display steps approach 1, which is what the eye
 * wants: big type needs proportionally less air between lines.
 */
export function lineHeightFor(size: number, base: number): number {
  return (size + base * 0.5) / size;
}

/**
 * Tracking tightens by 0.02em per doubling above the base and loosens a
 * little below it, within ±0.03em.
 */
export function trackingFor(size: number, base: number): number {
  const t = -0.02 * Math.log2(size / base);
  return Math.max(-0.03, Math.min(0.03, t));
}

export function sizeAt(step: Pick<Step, "slope" | "intercept" | "min" | "max">, viewport: number) {
  const lo = Math.min(step.min, step.max);
  const hi = Math.max(step.min, step.max);
  return Math.min(hi, Math.max(lo, step.intercept + step.slope * viewport));
}

export function generateScale(config: ScaleConfig): Step[] {
  const { minViewport, maxViewport, minBase, maxBase, minRatio, maxRatio } = config;
  const span = maxViewport - minViewport;
  const steps: Step[] = [];
  for (let i = -config.stepsDown; i <= config.stepsUp; i++) {
    const min = minBase * Math.pow(minRatio, i);
    const max = maxBase * Math.pow(maxRatio, i);
    const slope = span === 0 ? 0 : (max - min) / span;
    const intercept = min - slope * minViewport;
    // Leading and tracking are judged at the large end, where they matter most.
    steps.push({
      step: i,
      min,
      max,
      slope,
      intercept,
      lineHeight: lineHeightFor(max, maxBase),
      tracking: trackingFor(max, maxBase),
    });
  }
  return steps;
}

/** opsz is in typographic points, which CSS maps 1:1 to px. */
export function opszFor(size: number, range?: { min: number; max: number }) {
  if (!range) return size;
  return Math.min(range.max, Math.max(range.min, size));
}

// Output: the only place numbers are rounded --------------------------------

export function round(n: number, places = 4): number {
  const f = Math.pow(10, places);
  const r = Math.round((n + Number.EPSILON) * f) / f;
  return Object.is(r, -0) ? 0 : r;
}

/** Utopia naming: step-0 is the base, step--1 is one below it. */
export function stepName(step: number): string {
  return `step-${step}`;
}

/**
 * The clamp() for a step. `unit` is vw for real pages or cqi for previews
 * inside a container. Bounds are ordered so clamp() stays valid when a small
 * step shrinks as the viewport grows.
 */
export function clampFor(step: Step, unit: "vw" | "cqi" = "vw", rootPx = 16): string {
  const lo = Math.min(step.min, step.max) / rootPx;
  const hi = Math.max(step.min, step.max) / rootPx;
  const intercept = step.intercept / rootPx;
  const fluid = step.slope * 100;
  const sign = fluid < 0 ? "-" : "+";
  return `clamp(${round(lo)}rem, ${round(intercept)}rem ${sign} ${round(Math.abs(fluid))}${unit}, ${round(hi)}rem)`;
}

export function lineHeightValue(step: Step): number {
  return round(step.lineHeight, 3);
}

export function trackingValue(step: Step): string {
  return `${round(step.tracking, 4)}em`;
}
