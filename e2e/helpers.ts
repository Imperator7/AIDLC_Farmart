import { copyFile } from "node:fs/promises";
import { expect, type Locator, type Page, type PageAssertionsToHaveScreenshotOptions, type TestInfo } from "@playwright/test";

/**
 * Image test: `target` must match the committed baseline e2e/__screenshots__/…/<name>. On a pass, the baseline is
 * attached too, so /e2e shows what was compared; on a failure Playwright attaches expected, actual and diff.
 */
export async function matchesBaseline(target: Page | Locator, testInfo: TestInfo, name: string, options?: PageAssertionsToHaveScreenshotOptions) {
  await expect(target as Page).toHaveScreenshot(name, options);
  const copy = testInfo.outputPath(`baseline-${name}`);
  await copyFile(testInfo.snapshotPath(name, { kind: "screenshot" }), copy);
  await testInfo.attach(`baseline: ${name}`, { path: copy, contentType: "image/png" });
}

/**
 * Saves a screenshot of the page as a named step of the test; the /e2e report shows every step's image in order.
 * (Playwright's own `screenshot: "on"` adds the final state.)
 */
export async function snap(page: Page, testInfo: TestInfo, step: string) {
  const file = testInfo.outputPath(`${String(testInfo.attachments.length + 1).padStart(2, "0")}-${step.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.png`);
  await page.screenshot({ path: file, animations: "disabled", caret: "hide" });
  await testInfo.attach(step, { path: file, contentType: "image/png" });
}

/** Collects console errors and failed same-origin requests, so a test can assert the page loaded cleanly. */
export function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(e.message));
  return {
    errors,
    expectNone: () => expect(errors, "console errors").toEqual([]),
  };
}

/**
 * Waits until every image in the viewport has loaded, so image tests compare finished pages. Images below the fold
 * are lazy (next/image) and never load until scrolled to, so they don't count.
 */
export async function imagesLoaded(page: Page) {
  await page.waitForFunction(() =>
    [...document.images]
      .filter((img) => {
        const r = img.getBoundingClientRect();
        return r.width > 0 && r.bottom > 0 && r.top < window.innerHeight;
      })
      .every((img) => img.complete && img.naturalWidth > 0),
  );
}

/** The header cart button; its label carries the item count and total ("Your Cart, 2 items, $8.40"). */
export const cartButton = (page: Page) => page.getByRole("button", { name: /^Your Cart,/ });

/** The visible header search box (the desktop and mobile headers each render one). */
export const searchBox = (page: Page) => page.getByRole("combobox", { name: "Search products" }).filter({ visible: true });
