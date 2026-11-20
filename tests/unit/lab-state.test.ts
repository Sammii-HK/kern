import { describe, expect, it } from "vitest";
import { DEFAULT_STATE, decodeAxes, encodeAxes, parseLabState, serialiseLabState, systemQuery } from "@/lib/lab-state";

describe("lab state in the URL", () => {
  it("writes nothing for the defaults", () => {
    expect(serialiseLabState(DEFAULT_STATE).toString()).toBe("");
    expect(parseLabState(new URLSearchParams())).toEqual(DEFAULT_STATE);
  });

  it("round-trips a full system", () => {
    const state = {
      heading: { family: "Newsreader", axes: { wght: 650, opsz: 48 } },
      body: { family: "Inter Tight", axes: {} },
      mono: { family: "IBM Plex Mono", axes: { wght: 450 } },
      scale: { minViewport: 320, maxViewport: 1440, minBase: 16, maxBase: 19, minRatio: 1.2, maxRatio: 1.333, stepsUp: 6, stepsDown: 1 },
      headingFrom: 2,
    };
    const params = serialiseLabState(state);
    expect(parseLabState(new URLSearchParams(params.toString()))).toEqual(state);
  });

  it("keeps unrelated params and drops ones that return to default", () => {
    const base = new URLSearchParams("q=serif&h=Lora&fmin=15");
    const params = serialiseLabState(DEFAULT_STATE, base);
    expect(params.get("q")).toBe("serif");
    expect(params.has("h")).toBe(false);
    expect(params.has("fmin")).toBe(false);
  });

  it("encodes axes compactly and ignores junk", () => {
    expect(encodeAxes({ wght: 600, CASL: 0.5, slnt: -10 })).toBe("wght.600_CASL.0.5_slnt.-10");
    expect(decodeAxes("wght.600_CASL.0.5_slnt.-10")).toEqual({ wght: 600, CASL: 0.5, slnt: -10 });
    expect(decodeAxes("wght.abc_toolong.4_.5_x")).toEqual({});
  });

  it("clamps out-of-range scale values", () => {
    const s = parseLabState(new URLSearchParams("rmin=9&up=99&vmin=900&vmax=600"));
    expect(s.scale.minRatio).toBe(2);
    expect(s.scale.stepsUp).toBe(10);
    expect(s.scale.maxViewport).toBeGreaterThan(s.scale.minViewport);
  });

  it("carries only system keys between pages", () => {
    expect(systemQuery(new URLSearchParams("h=Lora&q=abc&fmax=21&pv=form"))).toBe("?h=Lora&fmax=21");
    expect(systemQuery(new URLSearchParams("q=abc"))).toBe("");
  });
});
