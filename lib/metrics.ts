/*
 * Font metrics measured in the browser with canvas, normalised to 1em, and the
 * maths that turns them into size-matched fallbacks.
 */

export interface FontMetrics {
  xHeight: number;
  capHeight: number;
  ascent: number;
  descent: number;
  /** Advance width averaged over English letter frequency, in em. */
  avgWidth: number;
}

/** Approximate English letter frequencies (per cent), plus the space. */
export const LETTER_WEIGHTS: Record<string, number> = {
  " ": 18.3,
  a: 6.7, b: 1.2, c: 2.3, d: 3.5, e: 10.4, f: 1.8, g: 1.6, h: 5.0, i: 5.7,
  j: 0.1, k: 0.6, l: 3.3, m: 2.0, n: 5.5, o: 6.1, p: 1.6, q: 0.1, r: 4.9,
  s: 5.2, t: 7.4, u: 2.3, v: 0.8, w: 1.9, x: 0.1, y: 1.6, z: 0.1,
};

export function weightedAverageWidth(widthOf: (ch: string) => number): number {
  let total = 0;
  let weight = 0;
  for (const [ch, w] of Object.entries(LETTER_WEIGHTS)) {
    total += widthOf(ch) * w;
    weight += w;
  }
  return total / weight;
}

let ctx: CanvasRenderingContext2D | null = null;

function context() {
  if (ctx) return ctx;
  if (typeof document === "undefined") return null;
  ctx = document.createElement("canvas").getContext("2d");
  return ctx;
}

/**
 * Measures a font that is already loaded. `cssFamily` is a full CSS
 * font-family value. Pass `full: false` for text-subset faces, which only
 * contain the x and H glyphs, to skip width and vertical metrics.
 *
 * `size` matters for families with an opsz axis: canvas text gets automatic
 * optical sizing, so a display-size measurement describes the display cut.
 * Measure each role at the size it is used.
 */
export function measureFont(
  cssFamily: string,
  { weight = 400, full = true, size = 100 }: { weight?: number; full?: boolean; size?: number } = {}
): FontMetrics | null {
  const c = context();
  if (!c) return null;
  const SIZE = size;
  c.font = `${weight} ${SIZE}px ${cssFamily}`;
  const x = c.measureText("x");
  const h = c.measureText("H");
  const metrics: FontMetrics = {
    xHeight: x.actualBoundingBoxAscent / SIZE,
    capHeight: h.actualBoundingBoxAscent / SIZE,
    ascent: 0,
    descent: 0,
    avgWidth: 0,
  };
  if (full) {
    metrics.ascent = (h.fontBoundingBoxAscent ?? h.actualBoundingBoxAscent) / SIZE;
    metrics.descent = (h.fontBoundingBoxDescent ?? 0) / SIZE;
    metrics.avgWidth = weightedAverageWidth((ch) => c.measureText(ch).width / SIZE);
  }
  return metrics;
}

/** Local fonts that are installed nearly everywhere, or have metric clones. */
export const LOCAL_FALLBACKS = {
  sans: "Arial",
  serif: "Times New Roman",
  mono: "Courier New",
} as const;

export type FallbackKind = keyof typeof LOCAL_FALLBACKS;

export interface FallbackFace {
  family: string;
  local: string;
  sizeAdjust: number;
  ascentOverride: number;
  descentOverride: number;
  lineGapOverride: number;
}

/**
 * The approach next/font and Capsize use: scale the fallback so its average
 * character width matches the web font (so lines wrap in the same places),
 * then override the vertical metrics so line boxes keep the same height.
 */
export function fallbackFace(
  family: string,
  target: FontMetrics,
  fallback: FontMetrics,
  kind: FallbackKind
): FallbackFace {
  const sizeAdjust = fallback.avgWidth > 0 ? target.avgWidth / fallback.avgWidth : 1;
  return {
    family: `${family} Fallback`,
    local: LOCAL_FALLBACKS[kind],
    sizeAdjust,
    ascentOverride: target.ascent / sizeAdjust,
    descentOverride: target.descent / sizeAdjust,
    lineGapOverride: 0,
  };
}

const pct = (n: number) => `${+(n * 100).toFixed(2)}%`;

export function fallbackFaceCss(face: FallbackFace): string {
  return [
    "@font-face {",
    `  font-family: "${face.family}";`,
    `  src: local("${face.local}");`,
    `  size-adjust: ${pct(face.sizeAdjust)};`,
    `  ascent-override: ${pct(face.ascentOverride)};`,
    `  descent-override: ${pct(face.descentOverride)};`,
    `  line-gap-override: ${pct(face.lineGapOverride)};`,
    "}",
  ].join("\n");
}

/**
 * Font-size multiplier that gives `font` the same x-height as `reference`.
 * Used to sit inline code at the body's x-height.
 */
export function xHeightMatch(reference: FontMetrics, font: FontMetrics): number {
  if (!font.xHeight) return 1;
  return reference.xHeight / font.xHeight;
}
