import { expect, test } from "@playwright/test";
import { cartButton, imagesLoaded, matchesBaseline, snap, watchErrors } from "./helpers";

test.describe("Product page", () => {
  test("shows the product and adds it to the cart", async ({ page }, testInfo) => {
    const watch = watchErrors(page);
    await page.goto("/products/bs5");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Homemade Oatmeal Cookies");
    await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toBeVisible();
    await expect(page.getByText("$4.20").first()).toBeVisible();
    await snap(page, testInfo, "product page");

    await page.getByRole("button", { name: "Add Homemade Oatmeal Cookies to cart" }).first().click();
    await expect(cartButton(page)).toHaveAccessibleName("Your Cart, 1 item, $4.20");
    await snap(page, testInfo, "added to cart");
    watch.expectNone();
  });

  test("an unknown product shows the 404 page", async ({ page }, testInfo) => {
    const res = await page.goto("/products/unknown");
    expect(res?.status()).toBe(404);
    await snap(page, testInfo, "not found");
  });

  test("image test: the product page matches the baseline", async ({ page }, testInfo) => {
    await page.goto("/products/bs5");
    await imagesLoaded(page);
    await matchesBaseline(page, testInfo, "product-bs5.png");
  });
});
