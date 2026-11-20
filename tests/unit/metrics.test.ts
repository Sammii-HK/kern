import { describe, expect, it } from "vitest";
import { fallbackFace, fallbackFaceCss, weightedAverageWidth, xHeightMatch, type FontMetrics } from "@/lib/metrics";

const target: FontMetrics = { xHeight: 0.546, capHeight: 0.727, ascent: 0.969, descent: 0.242, avgWidth: 0.5 };
const arial: FontMetrics = { xHeight: 0.519, capHeight: 0.716, ascent: 0.905, descent: 0.212, avgWidth: 0.45 };

describe("fallback faces", () => {
  it("scales the fallback to the web font's average width and rescales vertical metrics", () => {
    const face = fallbackFace("Inter", target, arial, "sans");
    expect(face.family).toBe("Inter Fallback");
    expect(face.local).toBe("Arial");
    expect(face.sizeAdjust).toBeCloseTo(0.5 / 0.45, 10);
    expect(face.ascentOverride * face.sizeAdjust).toBeCloseTo(target.ascent, 10);
    expect(face.descentOverride * face.sizeAdjust).toBeCloseTo(target.descent, 10);
  });

  it("writes valid @font-face CSS", () => {
    const css = fallbackFaceCss(fallbackFace("Inter", target, arial, "sans"));
    expect(css).toContain('font-family: "Inter Fallback";');
    expect(css).toContain('src: local("Arial");');
    expect(css).toMatch(/size-adjust: 111\.11%;/);
  });

  it("weights widths by letter frequency", () => {
    expect(weightedAverageWidth(() => 0.6)).toBeCloseTo(0.6, 10);
    // A face whose space is very wide averages wider than one with a narrow space.
    const wideSpace = weightedAverageWidth((c) => (c === " " ? 1 : 0.5));
    const narrowSpace = weightedAverageWidth((c) => (c === " " ? 0.2 : 0.5));
    expect(wideSpace).toBeGreaterThan(narrowSpace);
  });

  it("matches x-heights", () => {
    expect(xHeightMatch({ ...target, xHeight: 0.5 }, { ...target, xHeight: 0.55 })).toBeCloseTo(0.909, 3);
  });
});
