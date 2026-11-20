import type { Category, Family } from "./catalogue/types";

/*
 * Pairing suggestions: category-contrast rules, a hand-picked list, and
 * measured x-heights when they are available. Every suggestion carries its
 * reasons so the choice can be explained, not just accepted.
 */

export interface CuratedPair {
  heading: string;
  body: string;
  mono?: string;
  note: string;
}

export const CURATED: CuratedPair[] = [
  { heading: "Fraunces", body: "Inter", mono: "JetBrains Mono", note: "Soft, wonky serif display over a neutral workhorse." },
  { heading: "Newsreader", body: "Inter Tight", mono: "IBM Plex Mono", note: "Editorial serif with a true optical-size axis." },
  { heading: "Bricolage Grotesque", body: "Source Serif 4", mono: "DM Mono", note: "Characterful grotesque over a bookish serif, both with opsz." },
  { heading: "Playfair Display", body: "Source Sans 3", mono: "Source Code Pro", note: "High-contrast didone over a calm humanist sans." },
  { heading: "DM Serif Display", body: "DM Sans", mono: "DM Mono", note: "One foundry's system: matched proportions across roles." },
  { heading: "IBM Plex Serif", body: "IBM Plex Sans", mono: "IBM Plex Mono", note: "A superfamily: shared skeleton, contrasting finish." },
  { heading: "Space Grotesk", body: "Lora", mono: "Space Mono", note: "Quirky geometric headlines with a warm reading serif." },
  { heading: "Instrument Serif", body: "Instrument Sans", mono: "Geist Mono", note: "Condensed display serif over its sans sibling." },
  { heading: "Roboto Slab", body: "Roboto", mono: "Roboto Mono", note: "Slab headings on the most familiar UI sans." },
  { heading: "Merriweather", body: "Work Sans", mono: "Fira Code", note: "Sturdy screen serif with a friendly grotesque." },
  { heading: "Syne", body: "Literata", mono: "Martian Mono", note: "Expressive display sans over a serif built for long reads." },
  { heading: "Cormorant Garamond", body: "Manrope", mono: "Red Hat Mono", note: "Delicate Garamond headlines over a modern geometric sans." },
];

export interface Suggestion {
  family: Family;
  score: number;
  reasons: string[];
}

type Role = "heading" | "body" | "mono";

/** How well a heading category sits over a body category, 0 to 1. */
const CONTRAST: Partial<Record<Category, Partial<Record<Category, number>>>> = {
  serif: { "sans-serif": 1, serif: 0.25 },
  "sans-serif": { serif: 0.9, "sans-serif": 0.45 },
  display: { "sans-serif": 0.85, serif: 0.7 },
  handwriting: { "sans-serif": 0.8, serif: 0.5 },
  monospace: { "sans-serif": 0.6, serif: 0.6 },
};

const CATEGORY_LABEL: Record<Category, string> = {
  serif: "serif",
  "sans-serif": "sans",
  display: "display",
  handwriting: "script",
  monospace: "mono",
};

export function contrastScore(heading: Family, body: Family): number {
  return CONTRAST[heading.category]?.[body.category] ?? 0.2;
}

function curatedMatch(a: string, b: string, role: Role): CuratedPair | undefined {
  return CURATED.find((p) =>
    role === "mono"
      ? (p.heading === a || p.body === a) && p.mono === b
      : role === "body"
        ? p.heading === a && p.body === b
        : p.body === a && p.heading === b
  );
}

/** Families sharing a first word, such as "IBM Plex Sans" and "IBM Plex Serif". */
function sameSuperfamily(a: Family, b: Family) {
  const wa = a.family.split(" ");
  const wb = b.family.split(" ");
  return wa.length > 1 && wb.length > 1 && wa[0] === wb[0] && a.family !== b.family;
}

/** 1 for the most popular family, falling towards 0 on a log scale. */
function popularityScore(f: Family) {
  return 1 - Math.min(1, Math.log10(Math.max(1, f.popularity)) / 3.3);
}

function weightRange(f: Family) {
  const wght = f.axes.find((a) => a.tag === "wght");
  if (wght) return [wght.min, wght.max];
  return [f.weights[0] ?? 400, f.weights[f.weights.length - 1] ?? 400];
}

export interface SuggestOptions {
  /** Measured x-heights in em, keyed by family. */
  xHeights?: Record<string, number>;
  limit?: number;
}

/**
 * Ranks candidates for `role`, given the family already chosen for the
 * other role (`anchor`: the heading when suggesting a body, the body when
 * suggesting a heading or a mono).
 */
export function suggest(
  role: Role,
  anchor: Family,
  candidates: Family[],
  { xHeights = {}, limit = 8 }: SuggestOptions = {}
): Suggestion[] {
  const pool = candidates.filter((f) => {
    if (f.family === anchor.family) return false;
    if (role === "mono") return f.mono;
    if (role === "body") return f.category === "serif" || f.category === "sans-serif";
    return !f.mono;
  });

  const scored = pool.map((family) => {
    const reasons: string[] = [];
    let score = 0;
    const heading = role === "heading" ? family : anchor;
    const body = role === "heading" ? anchor : family;

    const curated = curatedMatch(anchor.family, family.family, role);
    if (curated) {
      score += 3;
      reasons.push(`Curated: ${curated.note}`);
    }

    if (role === "mono") {
      if (sameSuperfamily(anchor, family)) {
        score += 1.5;
        reasons.push("Same superfamily as the body");
      }
      const ax = xHeights[anchor.family];
      const fx = xHeights[family.family];
      if (ax && fx) {
        const ratio = fx / ax;
        score += 1 - Math.min(1, Math.abs(1 - ratio) * 4);
        if (Math.abs(1 - ratio) < 0.06) reasons.push("x-height within 6% of the body");
      }
      score += popularityScore(family) * 0.8;
      if (family.axes.some((a) => a.tag === "wght")) {
        score += 0.2;
        reasons.push("Variable weight");
      }
      return { family, score, reasons };
    }

    const contrast = contrastScore(heading, body);
    score += contrast * 2;
    if (contrast >= 0.85) {
      reasons.push(
        `${cap(CATEGORY_LABEL[heading.category])} heading over ${CATEGORY_LABEL[body.category]} body: clear contrast`
      );
    }
    if (sameSuperfamily(heading, body)) {
      score += 1;
      reasons.push("Same superfamily: shared proportions");
    }

    // The body does the heavy lifting: popular, a real weight range, italics, a generous x-height.
    if (role === "body") {
      score += popularityScore(family) * 1.2;
      const [lo, hi] = weightRange(family);
      if (lo <= 400 && hi >= 700) {
        score += 0.4;
      } else score -= 0.8;
      if (family.italic) {
        score += 0.3;
        reasons.push("Has true italics");
      }
      const x = xHeights[family.family];
      if (x) {
        if (x >= 0.5) {
          score += 0.5;
          reasons.push(`Generous x-height (${x.toFixed(2)}em) for reading sizes`);
        } else if (x < 0.44) score -= 0.4;
      }
    } else {
      score += popularityScore(family) * 0.6;
      if (family.axes.some((a) => a.tag === "opsz")) {
        score += 0.5;
        reasons.push("Optical-size axis tracks the scale");
      }
      const [, hi] = weightRange(family);
      if (hi >= 700) score += 0.2;
    }

    if (family.axes.length > 0 && !reasons.some((r) => r.startsWith("Variable"))) {
      score += 0.2;
      if (family.axes.length > 1) reasons.push(`Variable: ${family.axes.map((a) => a.tag).join(", ")}`);
    }

    return { family, score, reasons };
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
