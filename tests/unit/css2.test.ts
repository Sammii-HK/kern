import { describe, expect, it } from "vitest";
import { css2TextUrl, css2Url, familyParam, linkTags, sortAxisTags } from "@/lib/css2";
import type { Family } from "@/lib/catalogue/types";

const fraunces: Family = {
  family: "Fraunces",
  category: "serif",
  stroke: "serif",
  mono: false,
  popularity: 77,
  axes: [
    { tag: "SOFT", min: 0, max: 100, default: 0 },
    { tag: "WONK", min: 0, max: 1, default: 0 },
    { tag: "opsz", min: 9, max: 144, default: 14 },
    { tag: "wght", min: 100, max: 900, default: 400 },
  ],
  weights: [100, 400, 900],
  italic: true,
};

const lato: Family = { ...fraunces, family: "Lato", axes: [], weights: [400, 700] };

describe("css2 URLs", () => {
  it("orders axis tags lowercase first, then uppercase", () => {
    expect(sortAxisTags(["wght", "SOFT", "opsz", "WONK", "ital"])).toEqual(["ital", "opsz", "wght", "SOFT", "WONK"]);
  });

  it("requests every axis range for a variable family", () => {
    expect(familyParam({ family: fraunces })).toBe("Fraunces:opsz,wght,SOFT,WONK@9..144,100..900,0..100,0..1");
  });

  it("adds italic tuples when asked and available", () => {
    expect(familyParam({ family: fraunces, italic: true })).toBe(
      "Fraunces:ital,opsz,wght,SOFT,WONK@0,9..144,100..900,0..100,0..1;1,9..144,100..900,0..100,0..1"
    );
    expect(familyParam({ family: { ...fraunces, italic: false }, italic: true })).not.toContain("ital");
  });

  it("pins custom axes but keeps wght and opsz ranges", () => {
    expect(familyParam({ family: fraunces, pin: { SOFT: 50, wght: 600, opsz: 20 } })).toBe(
      "Fraunces:opsz,wght,SOFT,WONK@9..144,100..900,50,0..1"
    );
  });

  it("lists named weights for static families", () => {
    expect(familyParam({ family: lato })).toBe("Lato:wght@400;700");
    expect(familyParam({ family: lato, italic: true })).toBe("Lato:ital,wght@0,400;0,700;1,400;1,700");
    expect(familyParam({ family: { ...lato, weights: [400], italic: false } })).toBe("Lato");
  });

  it("joins families and sets font-display", () => {
    const url = css2Url([{ family: fraunces }, { family: lato }]);
    expect(url).toBe(
      "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT,WONK@9..144,100..900,0..100,0..1&family=Lato:wght@400;700&display=swap"
    );
  });

  it("builds text subsets with unique characters", () => {
    expect(css2TextUrl("Open Sans", "Open SansxH")).toBe(
      "https://fonts.googleapis.com/css2?family=Open+Sans&text=Open%20SasxH"
    );
  });

  it("escapes ampersands in the link tag", () => {
    expect(linkTags("https://x.test/?a=1&b=2")).toContain('href="https://x.test/?a=1&amp;b=2"');
  });
});
