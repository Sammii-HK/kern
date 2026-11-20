export type Category =
  | "sans-serif"
  | "serif"
  | "display"
  | "handwriting"
  | "monospace";

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: "sans-serif", label: "Sans serif" },
  { id: "serif", label: "Serif" },
  { id: "display", label: "Display" },
  { id: "handwriting", label: "Handwriting" },
  { id: "monospace", label: "Monospace" },
];

/** Construction of the letterforms, where the metadata knows it. */
export type Stroke = "sans" | "serif" | "slab" | null;

export interface FamilyAxis {
  tag: string;
  min: number;
  max: number;
  default: number;
}

export interface Family {
  family: string;
  category: Category;
  stroke: Stroke;
  /** True for monospaced families, including ones filed under another category. */
  mono: boolean;
  /** Popularity rank: 1 is the most used family on Google Fonts. */
  popularity: number;
  /** Variable axes, sorted by tag. Empty for static families. */
  axes: FamilyAxis[];
  /** Upright weights that exist as named instances. */
  weights: number[];
  italic: boolean;
}

export interface AxisInfo {
  tag: string;
  name: string;
  min: number;
  max: number;
  default: number;
  step: number;
  description: string;
}

export type CatalogueSource = "metadata" | "developer-api" | "snapshot";

export interface Catalogue {
  source: CatalogueSource;
  generatedAt: string;
  axisRegistry: Record<string, AxisInfo>;
  families: Family[];
}
