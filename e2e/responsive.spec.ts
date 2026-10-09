import { expect, test } from "@playwright/test";
import { imagesLoaded, matchesBaseline, snap } from "./helpers";

/** Runs in the "mobile" project only (375 × 812): no page may scroll sideways. */
test.describe("Mobile (375px)", () => {
  for (const [name, url] of [
    ["home", "/"],
    ["search", "/search?q=oat"],
    ["product", "/products/bs5"],
  ] as const) {
    test(`${name} has no horizontal scroll`, async ({ page }, testInfo) => {
      await page.goto(url);
      await imagesLoaded(page);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
      await snap(page, testInfo, `${name} at 375px`);
    });
  }

  test("the menu opens", async ({ page }, testInfo) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Toggle menu" }).click();
    await snap(page, testInfo, "menu open");
  });

  test("image test: home at 375px matches the baseline", async ({ page }, testInfo) => {
    await page.goto("/");
    await imagesLoaded(page);
    await matchesBaseline(page, testInfo, "home-mobile.png", { mask: [page.getByText(/Expires in/)] });
  });
});
