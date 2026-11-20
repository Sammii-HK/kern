import { describe, expect, it } from "vitest";
import snapshot from "@/data/fonts-snapshot.json";
import { normaliseCategory, slimDeveloperApi, slimMetadata, stepFromPrecision } from "@/lib/catalogue/slim";
import type { Catalogue } from "@/lib/catalogue/types";

const fixture = {
  axisRegistry: [
    { tag: "wght", displayName: "Weight", min: 1, max: 1000, defaultValue: 400, precision: 0, description: "Adjust the style from lighter to bolder in typographic color, by varying stroke weights, spacing and kerning, and other aspects of the type. This typically changes overall width.", fallbacks: [{ name: "Thin", value: 100 }] },
    { tag: "CASL", displayName: "Casual", min: 0, max: 1, defaultValue: 0, precision: -2, description: "Adjust stroke curvature. Lots more text." },
    { tag: "opsz", displayName: "Optical Size", min: 1, max: 1200, defaultValue: 14, precision: -1, description: "Adapt the style to specific text sizes." },
  ],
  familyMetadataList: [
    {
      family: "Fraunces",
      category: "Serif",
      stroke: "Serif",
      classifications: [],
      subsets: ["menu", "latin", "latin-ext"],
      fonts: { "100": {}, "400": {}, "900": {}, "400i": {} },
      axes: [
        { tag: "wght", min: 100, max: 900, defaultValue: 400 },
        { tag: "SOFT", min: 0, max: 100, defaultValue: 0 },
        { tag: "opsz", min: 9, max: 144, defaultValue: 14 },
        { tag: "BAD", min: 5, max: 5, defaultValue: 5 },
      ],
      popularity: 77,
      designers: ["Undercase Type"],
      size: 387672,
      isBrandFont: false,
    },
    {
      family: "Inter",
      category: "Sans Serif",
      stroke: "Sans Serif",
      classifications: [],
      subsets: ["latin"],
      fonts: { "400": {}, "700": {} },
      axes: [{ tag: "wght", min: 100, max: 900, defaultValue: 400 }],
      popularity: 5,
    },
    {
      family: "Major Mono Display",
      category: "Display",
      stroke: null,
      classifications: ["Monospace", "Display"],
      subsets: ["latin"],
      fonts: { "400": {} },
      axes: [],
      popularity: 900,
    },
    { family: "Noto Sans Adlam", category: "Sans Serif", subsets: ["adlam"], fonts: { "400": {} }, axes: [], popularity: 1653, isBrandFont: true },
    { family: 42, category: "Serif" },
  ],
  promotedScript: null,
};

describe("slimMetadata", () => {
  const catalogue = slimMetadata(fixture, new Date("2026-11-20T00:00:00Z"));

  it("keeps Latin families only and sorts by popularity rank", () => {
    expect(catalogue.families.map((f) => f.family)).toEqual(["Inter", "Fraunces", "Major Mono Display"]);
  });

  it("drops everything the lab does not use", () => {
    const fraunces = catalogue.families.find((f) => f.family === "Fraunces")!;
    expect(Object.keys(fraunces).sort()).toEqual(
      ["axes", "category", "family", "italic", "mono", "popularity", "stroke", "weights"].sort()
    );
    expect(JSON.stringify(catalogue).length).toBeLessThan(JSON.stringify(fixture).length);
  });

  it("normalises categories, strokes and monospace classification", () => {
    const [inter, fraunces, major] = catalogue.families;
    expect(inter.category).toBe("sans-serif");
    expect(inter.stroke).toBe("sans");
    expect(fraunces.category).toBe("serif");
    expect(major.category).toBe("display");
    expect(major.mono).toBe(true);
    expect(inter.mono).toBe(false);
  });

  it("sorts axes by tag and drops invalid ranges", () => {
    const fraunces = catalogue.families.find((f) => f.family === "Fraunces")!;
    expect(fraunces.axes.map((a) => a.tag)).toEqual(["SOFT", "opsz", "wght"]);
    expect(fraunces.axes.find((a) => a.tag === "opsz")).toEqual({ tag: "opsz", min: 9, max: 144, default: 14 });
  });

  it("reads upright weights and italics from the variant keys", () => {
    const fraunces = catalogue.families.find((f) => f.family === "Fraunces")!;
    expect(fraunces.weights).toEqual([100, 400, 900]);
    expect(fraunces.italic).toBe(true);
    expect(catalogue.families[0].italic).toBe(false);
  });

  it("slims the axis registry to names, steps and one-sentence descriptions", () => {
    expect(catalogue.axisRegistry.wght).toEqual({
      tag: "wght",
      name: "Weight",
      min: 1,
      max: 1000,
      default: 400,
      step: 1,
      description: "Adjust the style from lighter to bolder in typographic color, by varying stroke weights, spacing and kerning, and other aspects of the type.",
    });
    expect(catalogue.axisRegistry.CASL.step).toBe(0.01);
    expect(catalogue.axisRegistry.opsz.step).toBe(0.1);
  });

  it("records its source and time", () => {
    expect(catalogue.source).toBe("metadata");
    expect(catalogue.generatedAt).toBe("2026-11-20T00:00:00.000Z");
  });

  it("throws on an unexpected shape so the caller can fall back", () => {
    expect(() => slimMetadata({})).toThrow();
    expect(() => slimMetadata(null)).toThrow();
  });
});

describe("slimDeveloperApi", () => {
  const api = {
    kind: "webfonts#webfontList",
    items: [
      { family: "Roboto", category: "sans-serif", variants: ["100", "regular", "italic", "700"], subsets: ["latin"], axes: [{ tag: "wght", start: 100, end: 900 }, { tag: "wdth", start: 75, end: 100 }] },
      { family: "Lora", category: "serif", variants: ["regular", "700italic"], subsets: ["latin", "cyrillic"], axes: [{ tag: "wght", start: 400, end: 700 }] },
      { family: "Noto Sans Thai", category: "sans-serif", variants: ["regular"], subsets: ["thai"] },
    ],
  };
  const registry = slimMetadata(fixture).axisRegistry;
  const catalogue = slimDeveloperApi(api, registry);

  it("ranks by list order and fills axis defaults from the registry", () => {
    expect(catalogue.source).toBe("developer-api");
    expect(catalogue.families.map((f) => [f.family, f.popularity])).toEqual([
      ["Roboto", 1],
      ["Lora", 2],
    ]);
    const roboto = catalogue.families[0];
    expect(roboto.axes.find((a) => a.tag === "wght")?.default).toBe(400);
    // wdth is not in this registry: falls back to the axis minimum.
    expect(roboto.axes.find((a) => a.tag === "wdth")?.default).toBe(75);
    expect(roboto.weights).toEqual([100, 400, 700]);
    expect(roboto.italic).toBe(true);
    expect(catalogue.families[1].italic).toBe(true);
  });
});

describe("helpers", () => {
  it("maps registry precision to slider steps", () => {
    expect(stepFromPrecision(0)).toBe(1);
    expect(stepFromPrecision(-1)).toBe(0.1);
    expect(stepFromPrecision(-2)).toBe(0.01);
    expect(stepFromPrecision(1)).toBe(1);
    expect(stepFromPrecision(undefined)).toBe(1);
  });

  it("normalises category spellings", () => {
    expect(normaliseCategory("Sans Serif")).toBe("sans-serif");
    expect(normaliseCategory("sans-serif")).toBe("sans-serif");
    expect(normaliseCategory("MONOSPACE")).toBe("monospace");
    expect(normaliseCategory(undefined)).toBe("sans-serif");
  });
});

describe("bundled snapshot", () => {
  const cat = snapshot as Catalogue;

  it("is a usable catalogue", () => {
    expect(cat.source).toBe("snapshot");
    expect(cat.families.length).toBeGreaterThan(1500);
    expect(cat.families.filter((f) => f.axes.length).length).toBeGreaterThan(400);
    expect(Object.keys(cat.axisRegistry).length).toBeGreaterThan(40);
  });

  it("describes Fraunces with its real axes", () => {
    const fraunces = cat.families.find((f) => f.family === "Fraunces")!;
    expect(fraunces.axes.map((a) => a.tag)).toEqual(["SOFT", "WONK", "opsz", "wght"]);
  });
});
