import type { Family, FamilyAxis } from "./catalogue/types";

/*
 * Builders for Google Fonts css2 URLs. Pure functions so the export panel and
 * the in-app loader always ask for exactly the same thing.
 *
 * css2 rules: axis tags are listed lowercase first, then uppercase, each group
 * alphabetical; ranges use `min..max`; tuples for italics are separated by `;`.
 */

export function sortAxisTags(tags: string[]): string[] {
  const lower = tags.filter((t) => t === t.toLowerCase()).sort();
  const upper = tags.filter((t) => t !== t.toLowerCase()).sort();
  return [...lower, ...upper];
}

function fmt(n: number): string {
  return String(+n.toFixed(3));
}

export interface FamilyRequest {
  family: Family;
  /** Include italics when the family has them. */
  italic?: boolean;
  /**
   * When set, axes other than wght and opsz are pinned to these values
   * instead of requesting their full range. Smaller files.
   */
  pin?: Record<string, number>;
}

export function familyParam({ family, italic = false, pin }: FamilyRequest): string {
  const name = family.family.replace(/ /g, "+");
  const withItalic = italic && family.italic;

  if (family.axes.length === 0) {
    // Static family: ask for the named weights.
    const weights = family.weights;
    if (weights.length === 1 && weights[0] === 400 && !withItalic) return name;
    if (!withItalic) return `${name}:wght@${weights.join(";")}`;
    const tuples = [
      ...weights.map((w) => `0,${w}`),
      ...weights.map((w) => `1,${w}`),
    ];
    return `${name}:ital,wght@${tuples.join(";")}`;
  }

  const byTag = new Map<string, FamilyAxis>(family.axes.map((a) => [a.tag, a]));
  const tags = sortAxisTags([...byTag.keys()]);
  const values = tags.map((tag) => {
    const axis = byTag.get(tag)!;
    if (pin && tag !== "wght" && tag !== "opsz" && pin[tag] !== undefined) {
      return fmt(Math.min(axis.max, Math.max(axis.min, pin[tag])));
    }
    return `${fmt(axis.min)}..${fmt(axis.max)}`;
  });

  if (!withItalic) return `${name}:${tags.join(",")}@${values.join(",")}`;
  const allTags = sortAxisTags(["ital", ...tags]);
  const tuple = (ital: 0 | 1) =>
    allTags.map((t) => (t === "ital" ? String(ital) : values[tags.indexOf(t)])).join(",");
  return `${name}:${allTags.join(",")}@${tuple(0)};${tuple(1)}`;
}

export function css2Url(requests: FamilyRequest[], display = "swap"): string {
  const params = requests.map((r) => `family=${familyParam(r)}`);
  return `https://fonts.googleapis.com/css2?${params.join("&")}&display=${display}`;
}

/** A tiny subset containing only `text`, used for thumbnails and metrics. */
export function css2TextUrl(family: string, text: string): string {
  const unique = [...new Set(text)].join("");
  return `https://fonts.googleapis.com/css2?family=${family.replace(
    / /g,
    "+"
  )}&text=${encodeURIComponent(unique)}`;
}

export function linkTags(url: string): string {
  return [
    `<link rel="preconnect" href="https://fonts.googleapis.com">`,
    `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`,
    `<link rel="stylesheet" href="${url.replace(/&/g, "&amp;")}">`,
  ].join("\n");
}
