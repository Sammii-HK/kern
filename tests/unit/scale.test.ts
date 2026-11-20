import { describe, expect, it } from "vitest";
import {
  DEFAULT_SCALE,
  clampFor,
  generateScale,
  lineHeightFor,
  opszFor,
  round,
  sizeAt,
  trackingFor,
  type ScaleConfig,
} from "@/lib/scale";

const config: ScaleConfig = {
  minViewport: 320,
  maxViewport: 1440,
  minBase: 16,
  maxBase: 20,
  minRatio: 1.2,
  maxRatio: 1.333,
  stepsUp: 5,
  stepsDown: 2,
};

/** Evaluates a clamp() from clampFor at a viewport width, in px. */
function evaluate(clamp: string, viewport: number) {
  const m = clamp.match(/^clamp\(([\d.]+)rem, ([\d.-]+)rem ([+-]) ([\d.]+)vw, ([\d.]+)rem\)$/);
  if (!m) throw new Error(`Unexpected clamp: ${clamp}`);
  const [, lo, intercept, sign, vw, hi] = m;
  const fluid = Number(intercept) * 16 + (sign === "-" ? -1 : 1) * (Number(vw) / 100) * viewport;
  return Math.min(Number(hi) * 16, Math.max(Number(lo) * 16, fluid));
}

describe("generateScale", () => {
  const steps = generateScale(config);

  it("produces stepsDown + 1 + stepsUp steps in order", () => {
    expect(steps.map((s) => s.step)).toEqual([-2, -1, 0, 1, 2, 3, 4, 5]);
  });

  it("uses each viewport's own base and ratio (Utopia maths)", () => {
    const base = steps.find((s) => s.step === 0)!;
    expect(base.min).toBe(16);
    expect(base.max).toBe(20);
    const s3 = steps.find((s) => s.step === 3)!;
    expect(s3.min).toBeCloseTo(16 * 1.2 ** 3, 10);
    expect(s3.max).toBeCloseTo(20 * 1.333 ** 3, 10);
    const sm1 = steps.find((s) => s.step === -1)!;
    expect(sm1.min).toBeCloseTo(16 / 1.2, 10);
    expect(sm1.max).toBeCloseTo(20 / 1.333, 10);
  });

  it("keeps full precision internally (no rounding between steps)", () => {
    const s5 = steps.find((s) => s.step === 5)!;
    // 20 * 1.333^5 = 84.20...; a per-step rounding would drift from this.
    expect(s5.max).toBe(20 * Math.pow(1.333, 5));
  });

  it("interpolates linearly between the two viewports", () => {
    for (const s of steps) {
      expect(sizeAt(s, config.minViewport)).toBeCloseTo(s.min, 10);
      expect(sizeAt(s, config.maxViewport)).toBeCloseTo(s.max, 10);
      expect(sizeAt(s, (config.minViewport + config.maxViewport) / 2)).toBeCloseTo((s.min + s.max) / 2, 10);
      // Clamped outside the range.
      expect(sizeAt(s, 100)).toBeCloseTo(Math.min(s.min, s.max), 10);
      expect(sizeAt(s, 4000)).toBeCloseTo(Math.max(s.min, s.max), 10);
    }
  });

  it("emits clamp() values that reproduce the sizes at both viewports", () => {
    for (const s of steps) {
      const clamp = clampFor(s);
      expect(evaluate(clamp, config.minViewport)).toBeCloseTo(s.min, 2);
      expect(evaluate(clamp, config.maxViewport)).toBeCloseTo(s.max, 2);
    }
  });

  it("rounds once, at output", () => {
    const s2 = steps.find((s) => s.step === 2)!;
    expect(clampFor(s2)).toBe(
      `clamp(${round(s2.min / 16)}rem, ${round(s2.intercept / 16)}rem + ${round(s2.slope * 100)}vw, ${round(s2.max / 16)}rem)`
    );
  });

  it("keeps clamp() bounds ordered when a step shrinks as the viewport grows", () => {
    // A wider ratio on large screens pushes the steps below the base down as the viewport grows.
    const [s] = generateScale({ ...config, minBase: 16, maxBase: 16, minRatio: 1.1, maxRatio: 1.25, stepsDown: 2 });
    expect(s.min).toBeGreaterThan(s.max);
    const clamp = clampFor(s);
    expect(clamp).toMatch(/ - /);
    expect(evaluate(clamp, config.minViewport)).toBeCloseTo(s.min, 2);
    expect(evaluate(clamp, config.maxViewport)).toBeCloseTo(s.max, 2);
  });

  it("supports cqi for container-relative previews", () => {
    expect(clampFor(steps[3], "cqi")).toMatch(/cqi, /);
  });

  it("handles a zero-width range without dividing by zero", () => {
    const flat = generateScale({ ...config, maxViewport: config.minViewport });
    expect(flat.every((s) => Number.isFinite(s.intercept) && s.slope === 0)).toBe(true);
  });

  it("has sensible defaults", () => {
    expect(generateScale(DEFAULT_SCALE)).toHaveLength(DEFAULT_SCALE.stepsUp + DEFAULT_SCALE.stepsDown + 1);
  });
});

describe("leading, tracking and opsz", () => {
  it("sets body leading at 1.5 and tightens as size grows", () => {
    expect(lineHeightFor(20, 20)).toBe(1.5);
    expect(lineHeightFor(40, 20)).toBe(1.25);
    expect(lineHeightFor(80, 20)).toBeCloseTo(1.125, 10);
    const steps = generateScale(config);
    for (let i = 1; i < steps.length; i++) {
      expect(steps[i].lineHeight).toBeLessThan(steps[i - 1].lineHeight);
    }
  });

  it("tightens tracking by 0.02em per doubling, within ±0.03em", () => {
    expect(trackingFor(20, 20)).toBeCloseTo(0, 10);
    expect(trackingFor(40, 20)).toBeCloseTo(-0.02, 10);
    expect(trackingFor(10, 20)).toBeCloseTo(0.02, 10);
    expect(trackingFor(400, 20)).toBe(-0.03);
    expect(trackingFor(1, 20)).toBe(0.03);
  });

  it("ties opsz to the size, clamped to the axis range", () => {
    expect(opszFor(24, { min: 9, max: 144 })).toBe(24);
    expect(opszFor(6, { min: 9, max: 144 })).toBe(9);
    expect(opszFor(200, { min: 9, max: 144 })).toBe(144);
    expect(opszFor(30)).toBe(30);
  });
});

describe("round", () => {
  it("rounds half up and never returns -0", () => {
    expect(round(1.00005, 4)).toBe(1.0001);
    expect(Object.is(round(-0.00001, 4), 0)).toBe(true);
  });
});
