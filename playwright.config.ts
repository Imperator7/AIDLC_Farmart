import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end regression tests (e2e/*.spec.ts) against the production build. The standard Playwright workflow
 * (as `npm init playwright` sets it up):
 *   npm run build              the app under test
 *   npx playwright test        or npm run test:e2e; seeds its own database, then starts `next start` on port 3100
 *   npx playwright show-report or npm run test:e2e:report; Playwright's HTML report (playwright-report/)
 * The same run also writes reports/e2e/results.json, which the app's /e2e page shows with every screenshot.
 * Image tests (toHaveScreenshot) compare against the committed baselines in e2e/__screenshots__;
 * `npm run test:e2e:update` rewrites them after an intended UI change.
 *
 * Every run gets its own database, E2E_DB, deleted and seeded from src/data before the server starts, so the
 * tests never depend on what the development database (.data/farmart.sqlite) holds. It is seeded in the webServer
 * command because Playwright starts the webServer before globalSetup runs. One exception: the home page is pre-rendered
 * by `npm run build` (revalidate = 60), so its first HTML comes from whatever database the build read.
 */
const PORT = 3100;
const E2E_DB = ".data/e2e.sqlite";

export default defineConfig({
  testDir: "e2e",
  outputDir: "reports/e2e/artifacts",
  snapshotPathTemplate: "{testDir}/__screenshots__/{testFilePath}/{arg}-{projectName}-{platform}{ext}",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["list"],
    // Playwright's own report (traces, steps, image diffs): `npx playwright show-report`. Never opened automatically,
    // so a failing run doesn't block the terminal (or a git hook) on a report server.
    ["html", { outputFolder: "playwright-report", open: "never" }],
    // For the app's /e2e page.
    ["json", { outputFile: "reports/e2e/results.json" }],
  ],
  expect: {
    // Fonts and image decoding differ by a few pixels between runs; a real layout change moves far more.
    toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: "disabled", caret: "hide" },
  },
  use: {
    baseURL: `http://localhost:${PORT}`,
    // A screenshot of every test's final state, for the /e2e report.
    screenshot: "on",
    trace: "retain-on-failure",
    timezoneId: "UTC",
    locale: "en-GB",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } }, testIgnore: /responsive\.spec\.ts/ },
    { name: "mobile", use: { ...devices["Pixel 5"], viewport: { width: 375, height: 812 } }, testMatch: /responsive\.spec\.ts/ },
  ],
  webServer: {
    // A fresh database first (db:reset on E2E_DB), then Next's own binary through node; the whole server stops
    // with the run. If seeding fails, the server never starts and the seed's message is printed.
    command: `node node_modules/tsx/dist/cli.mjs scripts/seed/cli.ts --reset --file ${E2E_DB} && node node_modules/next/dist/bin/next start -p ${PORT}`,
    env: { FARMART_DB: E2E_DB },
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: false,
    timeout: 60_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
