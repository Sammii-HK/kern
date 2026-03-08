export interface FontAxis {
  tag: string;
  name: string;
  min: number;
  max: number;
  default: number;
  step: number;
}

export interface FontConfig {
  name: string;
  family: string;
  variable: string;
  axes: FontAxis[];
}

export const fonts: FontConfig[] = [
  {
    name: "Inter",
    family: "var(--font-inter)",
    variable: "--font-inter",
    axes: [
      { tag: "wght", name: "Weight", min: 100, max: 900, default: 400, step: 1 },
      { tag: "opsz", name: "Optical Size", min: 14, max: 32, default: 14, step: 1 },
    ],
  },
  {
    name: "Fraunces",
    family: "var(--font-fraunces)",
    variable: "--font-fraunces",
    axes: [
      { tag: "wght", name: "Weight", min: 100, max: 900, default: 400, step: 1 },
      { tag: "opsz", name: "Optical Size", min: 9, max: 144, default: 14, step: 1 },
      { tag: "SOFT", name: "Softness", min: 0, max: 100, default: 0, step: 1 },
      { tag: "WONK", name: "Wonky", min: 0, max: 1, default: 0, step: 1 },
    ],
  },
  {
    name: "Recursive",
    family: "var(--font-recursive)",
    variable: "--font-recursive",
    axes: [
      { tag: "wght", name: "Weight", min: 300, max: 1000, default: 400, step: 1 },
      { tag: "CASL", name: "Casual", min: 0, max: 1, default: 0, step: 0.01 },
      { tag: "CRSV", name: "Cursive", min: 0, max: 1, default: 0.5, step: 0.01 },
      { tag: "MONO", name: "Monospace", min: 0, max: 1, default: 0, step: 0.01 },
      { tag: "slnt", name: "Slant", min: -15, max: 0, default: 0, step: 0.5 },
    ],
  },
  {
    name: "Roboto Flex",
    family: "var(--font-roboto-flex)",
    variable: "--font-roboto-flex",
    axes: [
      { tag: "wght", name: "Weight", min: 100, max: 1000, default: 400, step: 1 },
      { tag: "wdth", name: "Width", min: 25, max: 151, default: 100, step: 0.1 },
      { tag: "opsz", name: "Optical Size", min: 8, max: 144, default: 14, step: 1 },
      { tag: "GRAD", name: "Grade", min: -200, max: 150, default: 0, step: 1 },
      { tag: "slnt", name: "Slant", min: -10, max: 0, default: 0, step: 0.5 },
    ],
  },
  {
    name: "Playfair Display",
    family: "var(--font-playfair)",
    variable: "--font-playfair",
    axes: [
      { tag: "wght", name: "Weight", min: 400, max: 900, default: 400, step: 1 },
    ],
  },
  {
    name: "Source Serif 4",
    family: "var(--font-source-serif)",
    variable: "--font-source-serif",
    axes: [
      { tag: "wght", name: "Weight", min: 200, max: 900, default: 400, step: 1 },
      { tag: "opsz", name: "Optical Size", min: 8, max: 60, default: 14, step: 1 },
    ],
  },
];

export function getFontByName(name: string): FontConfig | undefined {
  return fonts.find((f) => f.name === name);
}

export function buildFontVariationSettings(
  axes: FontAxis[],
  values: Record<string, number>
): string {
  return axes
    .map((axis) => `"${axis.tag}" ${values[axis.tag] ?? axis.default}`)
    .join(", ");
}

export function getDefaultAxisValues(axes: FontAxis[]): Record<string, number> {
  const values: Record<string, number> = {};
  for (const axis of axes) {
    values[axis.tag] = axis.default;
  }
  return values;
}
