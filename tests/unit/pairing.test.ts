import { describe, expect, it } from "vitest";
import snapshot from "@/data/fonts-snapshot.json";
import type { Catalogue } from "@/lib/catalogue/types";
import { CURATED, contrastScore, suggest } from "@/lib/pairing";

const families = (snapshot as Catalogue).families;
const get = (n: string) => families.find((f) => f.family === n)!;

describe("pairing", () => {
  it("every curated family exists in the catalogue", () => {
    for (const p of CURATED) {
      expect(get(p.heading), p.heading).toBeDefined();
      expect(get(p.body), p.body).toBeDefined();
      if (p.mono) expect(get(p.mono), p.mono).toBeDefined();
    }
  });

  it("prefers contrast between heading and body categories", () => {
    expect(contrastScore(get("Fraunces"), get("Inter"))).toBeGreaterThan(contrastScore(get("Fraunces"), get("Lora")));
  });

  it("suggests readable bodies for a serif heading, curated first, with reasons", () => {
    const out = suggest("body", get("Fraunces"), families.slice(0, 600));
    expect(out[0].family.family).toBe("Inter");
    expect(out[0].reasons.join(" ")).toMatch(/Curated/);
    expect(out.every((s) => s.family.category === "serif" || s.family.category === "sans-serif")).toBe(true);
  });

  it("only suggests monospaced families for the mono role", () => {
    const out = suggest("mono", get("IBM Plex Sans"), families.slice(0, 600));
    expect(out.every((s) => s.family.mono)).toBe(true);
    expect(out.slice(0, 3).map((s) => s.family.family)).toContain("IBM Plex Mono");
  });

  it("uses measured x-heights when it has them", () => {
    const pool = [get("Inter"), get("Lato")];
    const anchor = get("Playfair Display");
    const withX = suggest("body", anchor, pool, { xHeights: { Lato: 0.51, Inter: 0.43 } });
    expect(withX[0].family.family).toBe("Lato");
    expect(withX[0].reasons.join(" ")).toMatch(/x-height/);
  });
});
