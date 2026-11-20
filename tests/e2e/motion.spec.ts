import { expect, test, type Page } from "@playwright/test";

/** Moves the heading's wght slider to 900 and samples the preview's settings. */
async function dragWeight(page: Page) {
  await page.goto("/playground");
  await expect(page.locator("#axis-wght")).toBeVisible();
  return page.evaluate(async () => {
    const input = document.getElementById("axis-wght") as HTMLInputElement;
    const el = document.querySelector('[contenteditable="true"]') as HTMLElement;
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    set.call(input, "900");
    input.dispatchEvent(new Event("input", { bubbles: true }));
    const samples: string[] = [];
    for (let i = 0; i < 6; i++) {
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      samples.push(el.style.fontVariationSettings);
    }
    await new Promise((r) => setTimeout(r, 1500));
    samples.push(el.style.fontVariationSettings);
    return samples;
  });
}

const wght = (fvs: string) => Number(fvs.match(/"wght" ([\d.]+)/)?.[1]);

test("glyphs spring to new axis values", async ({ page }) => {
  const samples = await dragWeight(page);
  const values = samples.map(wght);
  // Intermediate frames sit between the old and new weight, then settle.
  expect(values.slice(0, 5).some((v) => v > 600 && v < 899)).toBe(true);
  expect(values[values.length - 1]).toBe(900);
});

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("glyphs jump straight to the new value", async ({ page }) => {
    const samples = await dragWeight(page);
    expect(samples.slice(1).every((s) => wght(s) === 900)).toBe(true);
  });
});
