import { describe, expect, it } from "vitest";
import snapshot from "@/data/fonts-snapshot.json";
import type { Catalogue } from "@/lib/catalogue/types";
import { exportCss, exportDtcg, exportTailwind, fontUrl, linkSnippet, type ExportInput } from "@/lib/export";
import { DEFAULT_STATE } from "@/lib/lab-state";

const byName = new Map((snapshot as Catalogue).families.map((f) => [f.family, f]));
const input: ExportInput = {
  state: { ...DEFAULT_STATE, heading: { family: "Fraunces", axes: { wght: 600, SOFT: 50 } } },
  families: {
    heading: byName.get("Fraunces"),
    body: byName.get("Inter"),
    mono: byName.get("JetBrains Mono"),
  },
  fallbacks: {
    body: { family: "Inter Fallback", local: "Arial", sizeAdjust: 1.07, ascentOverride: 0.9, descentOverride: 0.22, lineGapOverride: 0 },
  },
  monoScale: 0.95,
};

describe("exports", () => {
  it("CSS: font stacks with fallbacks, fluid steps with leading and tracking", () => {
    const css = exportCss(input);
    expect(css).toContain('--font-body: "Inter", "Inter Fallback", sans-serif;');
    expect(css).toContain('--font-heading-variation: "SOFT" 50;');
    expect(css).toMatch(/--step-0: clamp\([^)]+\);/);
    expect(css).toContain("--step-0-leading: 1.5;");
    expect(css).toContain("font-optical-sizing: auto;");
    expect(css).toContain("--font-mono-scale: 0.95;");
    expect(css).toContain('src: local("Arial");');
  });

  it("Tailwind v4: @theme with companion line-height and letter-spacing", () => {
    const tw = exportTailwind(input);
    expect(tw).toContain("@theme {");
    expect(tw).toMatch(/--text-step-2: clamp\(/);
    expect(tw).toMatch(/--text-step-2--line-height: [\d.]+;/);
    expect(tw).toMatch(/--text-step-2--letter-spacing: -?[\d.]+em;/);
    expect(tw).toContain('--font-heading: "Fraunces", serif;');
  });

  it("DTCG: valid JSON with typography tokens at both viewport ends", () => {
    const tokens = JSON.parse(exportDtcg(input));
    expect(tokens.font.family.body.$type).toBe("fontFamily");
    expect(tokens.font.family.body.$value).toEqual(["Inter", "Inter Fallback", "sans-serif"]);
    expect(tokens.font.weight.heading.$value).toBe(600);
    const step0 = tokens.typography["step-0"];
    expect(step0.min.$type).toBe("typography");
    expect(step0.min.$value.fontFamily).toBe("{font.family.body}");
    expect(step0.min.$value.fontSize).toEqual({ value: DEFAULT_STATE.scale.minBase / 16, unit: "rem" });
    expect(step0.max.$value.fontSize).toEqual({ value: DEFAULT_STATE.scale.maxBase / 16, unit: "rem" });
    expect(step0.max.$value.letterSpacing.unit).toBe("px");
    expect(step0.$extensions["dev.sammii.kern"].clamp).toMatch(/^clamp\(/);
    // Heading steps carry the opsz the heading face will use at each end.
    expect(tokens.typography["step-3"].max.$extensions["dev.sammii.kern"].opsz).toBeGreaterThan(9);
  });

  it("font link: one request, body with italics, custom axes pinned", () => {
    const url = fontUrl(input);
    expect(url.match(/family=/g)).toHaveLength(3);
    expect(url).toContain("family=Fraunces:opsz,wght,SOFT,WONK@9..144,100..900,50,0");
    expect(url).toMatch(/family=Inter:ital,opsz,wght@0,/);
    expect(fontUrl({ ...input, fullRanges: true })).toContain("0..100,0..1");
    expect(linkSnippet(input)).toContain('rel="preconnect"');
  });
});
