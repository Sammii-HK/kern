import { describe, expect, it } from "vitest";
import { DEFAULT_SPRING, isSettled, stepSpring } from "@/lib/spring";

function run(from: number, to: number, seconds: number, fps: number) {
  let s = { x: from, v: 0 };
  const xs: number[] = [];
  for (let t = 0; t < seconds; t += 1 / fps) {
    s = stepSpring(s, to, 1 / fps);
    xs.push(s.x);
  }
  return { s, xs };
}

describe("stepSpring", () => {
  it("settles on the target", () => {
    const { s } = run(400, 900, 2, 60);
    expect(isSettled(s, 900, 800)).toBe(true);
  });

  it("moves the same at 60Hz and 120Hz", () => {
    const a = run(100, 900, 0.5, 60).s.x;
    const b = run(100, 900, 0.5, 120).s.x;
    expect(Math.abs(a - b)).toBeLessThan(2);
  });

  it("overshoots only slightly with the default tuning", () => {
    const { xs } = run(0, 100, 2, 60);
    expect(Math.max(...xs)).toBeLessThan(105);
  });

  it("survives a long frame without exploding", () => {
    const s = stepSpring({ x: 0, v: 0 }, 100, 5, DEFAULT_SPRING);
    expect(Number.isFinite(s.x)).toBe(true);
    expect(Math.abs(s.x)).toBeLessThan(200);
  });
});
