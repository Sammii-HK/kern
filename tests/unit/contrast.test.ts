import { test, expect } from "vitest";
import { readFileSync } from "node:fs";
const css = readFileSync(
  new URL("../../app/globals.css", import.meta.url),
  "utf8",
);
const themes = [...css.matchAll(/(?:\:root|\.dark)\s*\{([^}]+)\}/g)].map(
  (match) =>
    Object.fromEntries(
      [...match[1].matchAll(/--([\w-]+)\s*:\s*(#[a-f\d]{6})/gi)].map(
        (value) => [value[1], value[2]],
      ),
    ),
);
function luminance(hex: string) {
  const rgb = hex
    .slice(1)
    .match(/../g)!
    .map((channel) => parseInt(channel, 16) / 255)
    .map((value) =>
      value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
    );
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}
function contrast(first: string, second: string) {
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}
test("actual light/dark primary and secondary text tokens remain readable on both interface surfaces", () => {
  expect(themes).toHaveLength(2);
  for (const theme of themes)
    for (const background of ["background", "surface"]) {
      for (const text of ["foreground", "muted"])
        expect(
          contrast(theme[text], theme[background]),
          `${text} on ${background}`,
        ).toBeGreaterThanOrEqual(4.5);
      expect(
        contrast(theme.accent, theme[background]),
        `focus on ${background}`,
      ).toBeGreaterThanOrEqual(3);
    }
});
