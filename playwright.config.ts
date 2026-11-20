import { defineConfig, devices } from "@playwright/test";

const PORT = 3117;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    // Uses the installed Google Chrome by default so no browser download is
    // needed; set PW_CHANNEL="" to use Playwright's own Chromium instead.
    channel: process.env.PW_CHANNEL ?? "chrome",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } }],
  webServer: {
    command: `npx next dev --port ${PORT}`,
    url: `http://localhost:${PORT}/api/fonts`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // The bundled catalogue keeps the test independent of the undocumented
    // metadata endpoint. Font files still come from Google Fonts.
    env: { KERN_FONTS_SOURCE: "snapshot" },
  },
});
