import { expect, test } from "@playwright/test";
import { imagesLoaded, matchesBaseline, searchBox, snap, watchErrors } from "./helpers";

test.describe("Search", () => {
  test("suggests products while typing, and Enter opens the results", async ({ page }, testInfo) => {
    const watch = watchErrors(page);
    await page.goto("/");
    await searchBox(page).fill("oat");
    const suggestions = page.getByRole("listbox", { name: "Search suggestions" });
    await expect(suggestions.getByRole("option", { name: /Homemade Oatmeal Cookies/ })).toBeVisible();
    await snap(page, testInfo, "suggestions open");

    await searchBox(page).press("Enter");
    await expect(page).toHaveURL(/\/search\?q=oat/);
    await expect(page.getByText("1 product", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Homemade Oatmeal Cookies" }).first()).toBeVisible();
    await snap(page, testInfo, "results for oat");
    watch.expectNone();
  });

  test("lists every product over two pages", async ({ page }, testInfo) => {
    await page.goto("/search");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("All products");
    await expect(page.getByText("16 products")).toBeVisible();
    const pagination = page.getByRole("navigation", { name: "Pagination" });
    await expect(pagination).toContainText("Page 1 of 2");
    await snap(page, testInfo, "page 1");
    await pagination.getByRole("link", { name: "Next" }).click();
    await expect(pagination).toContainText("Page 2 of 2");
    await snap(page, testInfo, "page 2");
  });

  test("sorts by price, lowest first", async ({ page }, testInfo) => {
    await page.goto("/search?category=fruits-vegetables&sort=price_asc");
    const names = page.getByRole("button", { name: /^Add .* to cart$/ });
    await expect(names).toHaveCount(3);
    // Organic Bananas $1.95 < Sweet Yellow Melon $3.90 < Blood Oranges $4.15.
    await expect(names.nth(0)).toHaveAccessibleName("Add Organic Bananas to cart");
    await expect(names.nth(2)).toHaveAccessibleName("Add Blood Oranges, Sweet & Juicy to cart");
    await snap(page, testInfo, "sorted by price");
  });

  test("an empty category shows the empty state", async ({ page }, testInfo) => {
    await page.goto("/search?category=coffees-teas");
    await expect(page.getByRole("heading", { name: "No products here yet" })).toBeVisible();
    await snap(page, testInfo, "empty state");
  });

  test("regression: control characters in q are ignored, not matched against everything", async ({ page }, testInfo) => {
    // q=%00 once matched all 16 products as a "search"; the page now drops the invalid q and says so plainly.
    await page.goto("/search?q=%00");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("All products");
    await snap(page, testInfo, "q is only a NUL byte");
  });

  test("regression: more than five words still search with the longest ones", async ({ page }, testInfo) => {
    await page.goto("/search?q=a%20b%20c%20d%20e%20f%20oat");
    await expect(page.getByText("1 product", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Homemade Oatmeal Cookies" }).first()).toBeVisible();
    await snap(page, testInfo, "seven-word query");
  });

  test("image test: search results match the baseline", async ({ page }, testInfo) => {
    await page.goto("/search?category=fruits-vegetables");
    await imagesLoaded(page);
    await matchesBaseline(page, testInfo, "search-fruits-vegetables.png");
  });
});
