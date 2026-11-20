import type {
  AxisInfo,
  Catalogue,
  Category,
  Family,
  FamilyAxis,
  Stroke,
} from "./types";

/*
 * Google Fonts metadata is about 2.7MB of mostly display data. These functions
 * keep only what the lab needs and normalise the two upstream shapes (the
 * undocumented metadata endpoint and the official Developer API) into one.
 */

const CATEGORY_MAP: Record<string, Category> = {
  "sans serif": "sans-serif",
  "sans-serif": "sans-serif",
  serif: "serif",
  display: "display",
  handwriting: "handwriting",
  monospace: "monospace",
};

export function normaliseCategory(raw: unknown): Category {
  if (typeof raw !== "string") return "sans-serif";
  return CATEGORY_MAP[raw.trim().toLowerCase()] ?? "sans-serif";
}

function normaliseStroke(raw: unknown): Stroke {
  if (typeof raw !== "string") return null;
  const s = raw.toLowerCase();
  if (s.startsWith("slab")) return "slab";
  if (s.startsWith("sans")) return "sans";
  if (s.startsWith("serif")) return "serif";
  return null;
}

/** Registry precision is a power of ten: -2 means steps of 0.01. */
export function stepFromPrecision(precision: unknown): number {
  if (typeof precision !== "number" || !Number.isFinite(precision)) return 1;
  return Math.min(1, Math.pow(10, Math.round(precision)));
}

function firstSentence(text: unknown): string {
  if (typeof text !== "string") return "";
  const match = text.match(/^.*?[.!?](\s|$)/);
  return (match ? match[0] : text).trim();
}

function cleanAxes(raw: unknown): FamilyAxis[] {
  if (!Array.isArray(raw)) return [];
  const axes: FamilyAxis[] = [];
  for (const a of raw) {
    if (!a || typeof a.tag !== "string") continue;
    const min = Number(a.min ?? a.start);
    const max = Number(a.max ?? a.end);
    if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max) continue;
    let def = Number(a.defaultValue ?? a.default);
    if (!Number.isFinite(def)) def = a.tag === "wght" ? clamp(400, min, max) : min;
    axes.push({ tag: a.tag, min, max, default: clamp(def, min, max) });
  }
  return axes.sort((x, y) => (x.tag < y.tag ? -1 : x.tag > y.tag ? 1 : 0));
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

/** Parses variant keys such as "400", "700i", "regular" or "700italic". */
function parseVariants(keys: string[]): { weights: number[]; italic: boolean } {
  const weights = new Set<number>();
  let italic = false;
  for (const key of keys) {
    const k = key.toLowerCase();
    if (k === "regular") weights.add(400);
    else if (k === "italic") italic = true;
    else {
      const m = k.match(/^(\d{3,4})(i|italic)?$/);
      if (!m) continue;
      if (m[2]) italic = true;
      else weights.add(Number(m[1]));
    }
  }
  return { weights: [...weights].sort((a, b) => a - b), italic };
}

interface MetadataFamily {
  family?: unknown;
  category?: unknown;
  stroke?: unknown;
  classifications?: unknown;
  subsets?: unknown;
  fonts?: unknown;
  axes?: unknown;
  popularity?: unknown;
}

interface MetadataAxis {
  tag?: unknown;
  displayName?: unknown;
  min?: unknown;
  max?: unknown;
  defaultValue?: unknown;
  precision?: unknown;
  description?: unknown;
}

export function slimAxisRegistry(raw: unknown): Record<string, AxisInfo> {
  const out: Record<string, AxisInfo> = {};
  if (!Array.isArray(raw)) return out;
  for (const a of raw as MetadataAxis[]) {
    if (typeof a?.tag !== "string") continue;
    out[a.tag] = {
      tag: a.tag,
      name: typeof a.displayName === "string" ? a.displayName : a.tag,
      min: Number(a.min),
      max: Number(a.max),
      default: Number(a.defaultValue),
      step: stepFromPrecision(a.precision),
      description: firstSentence(a.description),
    };
  }
  return out;
}

/**
 * Slims the response of fonts.google.com/metadata/fonts. Drops families
 * without a Latin subset (every preview is Latin text), then sorts by
 * popularity rank.
 */
export function slimMetadata(raw: unknown, now = new Date()): Catalogue {
  const data = (raw ?? {}) as {
    axisRegistry?: unknown;
    familyMetadataList?: unknown;
  };
  if (!Array.isArray(data.familyMetadataList)) {
    throw new Error("Metadata response has no familyMetadataList");
  }

  const families: Family[] = [];
  for (const f of data.familyMetadataList as MetadataFamily[]) {
    if (typeof f?.family !== "string") continue;
    const subsets = Array.isArray(f.subsets) ? f.subsets : [];
    if (!subsets.includes("latin")) continue;

    const classifications = Array.isArray(f.classifications)
      ? f.classifications.map((c) => String(c).toLowerCase())
      : [];
    const category = normaliseCategory(f.category);
    const variants = parseVariants(
      f.fonts && typeof f.fonts === "object" ? Object.keys(f.fonts) : []
    );

    families.push({
      family: f.family,
      category,
      stroke: normaliseStroke(f.stroke),
      mono: category === "monospace" || classifications.includes("monospace"),
      popularity: Number.isFinite(Number(f.popularity))
        ? Number(f.popularity)
        : Number.MAX_SAFE_INTEGER,
      axes: cleanAxes(f.axes),
      weights: variants.weights.length ? variants.weights : [400],
      italic: variants.italic,
    });
  }

  families.sort(byPopularity);
  return {
    source: "metadata",
    generatedAt: now.toISOString(),
    axisRegistry: slimAxisRegistry(data.axisRegistry),
    families,
  };
}

interface DeveloperApiItem {
  family?: unknown;
  category?: unknown;
  variants?: unknown;
  subsets?: unknown;
  axes?: unknown;
}

/**
 * Slims the official Developer API (`webfonts/v1/webfonts?capability=VF&sort=popularity`).
 * It has no popularity number or axis defaults, so rank comes from list order
 * and defaults are filled in from the axis registry when one is supplied.
 */
export function slimDeveloperApi(
  raw: unknown,
  registry: Record<string, AxisInfo> = {},
  now = new Date()
): Catalogue {
  const items = (raw as { items?: unknown })?.items;
  if (!Array.isArray(items)) throw new Error("Developer API response has no items");

  const families: Family[] = [];
  (items as DeveloperApiItem[]).forEach((item, index) => {
    if (typeof item?.family !== "string") return;
    const subsets = Array.isArray(item.subsets) ? item.subsets : [];
    if (!subsets.includes("latin")) return;
    const category = normaliseCategory(item.category);
    const variants = parseVariants(
      Array.isArray(item.variants) ? item.variants.map(String) : []
    );
    const axes = cleanAxes(
      Array.isArray(item.axes)
        ? item.axes.map((a: { tag?: string; start?: number; end?: number }) => ({
            ...a,
            defaultValue:
              a.tag && registry[a.tag] && a.start !== undefined && a.end !== undefined
                ? clamp(registry[a.tag].default, a.start, a.end)
                : undefined,
          }))
        : []
    );
    families.push({
      family: item.family,
      category,
      stroke: category === "serif" ? "serif" : category === "sans-serif" ? "sans" : null,
      mono: category === "monospace",
      popularity: index + 1,
      axes,
      weights: variants.weights.length ? variants.weights : [400],
      italic: variants.italic,
    });
  });

  families.sort(byPopularity);
  return {
    source: "developer-api",
    generatedAt: now.toISOString(),
    axisRegistry: registry,
    families,
  };
}

function byPopularity(a: Family, b: Family) {
  return a.popularity - b.popularity || a.family.localeCompare(b.family);
}
