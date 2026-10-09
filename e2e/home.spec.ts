import { expect, test } from "@playwright/test";
import { imagesLoaded, matchesBaseline, snap, watchErrors } from "./helpers";

test.describe("Home page", () => {
  test("shows every section from the seeded database", async ({ page }, testInfo) => {
    const watch = watchErrors(page);
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Farmart/);
    await expect(page.getByRole("heading", { name: "Cold-Pressed Orange Juice 1L" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Top Saver Today" })).toBeVisible();
    await expect(page.getByText(/Expires in/)).toBeVisible();
    await expect(page.getByRole("heading", { name: "Best Seller" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "New Arrivals" })).toBeVisible();
    await snap(page, testInfo, "home top");

    // Top Saver is ordered by biggest saving: ts4, ts1, ts2, ts3 (seed-data.md).
    for (const name of ["Blood Oranges, Sweet & Juicy", "Craft Beer Can Variety Pack 330ml x 12", "British Beef Mince (10% Fat)", "Farmhouse Soft White Bread"])
      await expect(page.getByRole("button", { name: `Add ${name} to cart` }).first()).toBeVisible();
    await page.getByRole("heading", { name: "Best Seller" }).scrollIntoViewIfNeeded();
    await expect(page.getByRole("button", { name: "Add Organic Bananas to cart" }).first()).toBeVisible();
    await snap(page, testInfo, "product rows");
    watch.expectNone();
  });

  test("category tiles and banners lead to search", async ({ page }, testInfo) => {
    await page.goto("/");
    await page.getByRole("link", { name: /Fruits & Vegetables/ }).first().click();
    await expect(page).toHaveURL(/\/search\?category=fruits-vegetables/);
    await expect(page.getByText("3 products")).toBeVisible();
    await snap(page, testInfo, "category from home");
  });

  test("regression: the closed cart drawer casts no shadow on the page", async ({ page }) => {
    // Off-screen with translate-x-full, its shadow-2xl still drew a grey band down the right edge of every page.
    await page.goto("/");
    await expect(page.getByRole("dialog", { includeHidden: true })).toHaveCSS("box-shadow", "none");
  });

  test("image test: the page above the fold matches the baseline", async ({ page }, testInfo) => {
    await page.goto("/");
    await imagesLoaded(page);
    // The countdown changes every second, so it is masked out of the comparison.
    await matchesBaseline(page, testInfo, "home-above-the-fold.png", { mask: [page.getByText(/Expires in/)] });
  });
});
