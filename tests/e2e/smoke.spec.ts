import { expect, test } from "@playwright/test";

test("search, pair and export a type system", async ({ page }) => {
  // Browse: search the catalogue and assign a heading.
  await page.goto("/");
  await expect(page.getByTestId("result-count")).not.toHaveText(/^0 /);
  await page.getByTestId("browse-search").fill("Newsreader");
  await expect(page.getByTestId("result-count")).toHaveText("1 family");
  await page.locator('[data-family="Newsreader"]').click();
  const detail = page.getByTestId("family-detail");
  await expect(detail).toContainText("Newsreader");
  // Axis controls come from the metadata: Newsreader has opsz and wght.
  await expect(detail.locator('input[data-axis="wght"]')).toBeVisible();
  await expect(detail.locator('input[data-axis="opsz"]')).toBeAttached();
  await page.getByTestId("assign-heading").click();
  await expect(page).toHaveURL(/h=Newsreader/);

  // Filters: variable plus has-opsz narrows the list to opsz families.
  await page.getByTestId("browse-search").fill("");
  await page.getByTestId("filter-opsz").click();
  await expect(page).toHaveURL(/opsz=1/);
  const count = Number((await page.getByTestId("result-count").textContent())?.split(" ")[0]);
  expect(count).toBeGreaterThan(5);
  expect(count).toBeLessThan(100);

  // Pairing: the nav carries the system across pages.
  await page.getByRole("link", { name: "Pairing" }).click();
  await expect(page).toHaveURL(/\/pairing\?h=Newsreader/);
  await expect(page.getByTestId("picker-heading")).toHaveAttribute("placeholder", "Newsreader");
  const suggestions = page.getByTestId("suggestions-body").locator("button");
  await expect(suggestions.first()).toBeVisible();
  // Newsreader + Inter Tight is a curated pair, so it leads the list.
  await expect(suggestions.first()).toHaveAttribute("data-family", "Inter Tight");
  await suggestions.first().click();
  await expect(page).toHaveURL(/b=Inter\+Tight/);
  await expect(page.getByTestId("ui-preview")).toContainText("The quiet work of a good type scale");
  await page.getByRole("tab", { name: "Pricing" }).click();
  await expect(page.getByTestId("ui-preview")).toContainText("Simple pricing");
  // Metrics are measured from the loaded fonts.
  await expect(page.getByTestId("mono-scale")).toHaveText(/^\d\.\d{3}em$/, { timeout: 30_000 });

  // Pick a mono through the combobox.
  await page.getByTestId("picker-mono").click();
  await page.getByTestId("picker-mono").fill("IBM Plex M");
  await page.getByRole("option", { name: /IBM Plex Mono/ }).click();
  await expect(page).toHaveURL(/m=IBM\+Plex\+Mono/);

  // Export: every format reflects the system.
  await page.getByRole("link", { name: "Export" }).click();
  await expect(page).toHaveURL(/\/export\?.*h=Newsreader/);
  const output = page.getByTestId("export-output");
  await expect(output).toContainText('--font-heading: "Newsreader"');
  await expect(output).toContainText("--step-0: clamp(");

  await page.getByTestId("format-tailwind").click();
  await expect(output).toContainText("@theme {");
  await expect(output).toContainText("--text-step-0--line-height");

  await page.getByTestId("format-dtcg").click();
  await expect(output).toContainText('"$type": "typography"');
  const tokens = JSON.parse((await output.textContent()) ?? "{}");
  expect(tokens.font.family.heading.$value[0]).toBe("Newsreader");
  expect(tokens.font.family.mono.$value[0]).toBe("IBM Plex Mono");

  await page.getByTestId("format-link").click();
  await expect(output).toContainText("https://fonts.googleapis.com/css2?family=Newsreader");
  await expect(output).toContainText("family=IBM+Plex+Mono");

  // The URL alone reproduces the export.
  const url = page.url();
  await page.goto(url);
  await expect(page.getByTestId("export-output")).toContainText("family=Inter+Tight");
});
