import { expect, test } from "@playwright/test";
import { cartButton, imagesLoaded, matchesBaseline, snap } from "./helpers";

test.describe("Cart", () => {
  test("add, change the quantity, remove, from the card and the drawer", async ({ page }, testInfo) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Add Organic Bananas to cart" }).first().click();
    // The toast has a compact and a full layout; one of them is shown.
    await expect(page.getByText("Added Organic Bananas", { exact: true }).filter({ visible: true })).toBeVisible();
    await expect(cartButton(page)).toHaveAccessibleName("Your Cart, 1 item, $1.95");
    await snap(page, testInfo, "toast after add");

    await page.getByRole("button", { name: "Increase Organic Bananas" }).first().click();
    await expect(cartButton(page)).toHaveAccessibleName("Your Cart, 2 items, $3.90");

    await cartButton(page).click();
    const drawer = page.getByRole("dialog");
    await expect(drawer.getByRole("heading")).toHaveText(/Your Cart \(2 items\)/);
    await snap(page, testInfo, "drawer with 2 bananas");

    await drawer.getByRole("button", { name: "Decrease Organic Bananas" }).click();
    await drawer.getByRole("button", { name: "Remove Organic Bananas from cart" }).click();
    await expect(cartButton(page)).toHaveAccessibleName("Your Cart, 0 items, $0.00");
    await snap(page, testInfo, "empty after remove");
  });

  test("the cart survives a reload", async ({ page }, testInfo) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Add Sweet Yellow Melon to cart" }).first().click();
    await page.reload();
    await expect(cartButton(page)).toHaveAccessibleName("Your Cart, 1 item, $3.90");
    await snap(page, testInfo, "after reload");
  });

  test("regression: an edited localStorage cart can't produce text quantities or decimals", async ({ page }, testInfo) => {
    // This exact value once showed "051.5 items": "5" was added as text, and 1.5 was kept.
    const product = { id: "bs1", name: "Organic Bananas", brand: "Sunny Farm", price: 1.95, oldPrice: null, unit: "1kg", image: "/x.png", rating: 5, category: "x", categorySlug: "x" };
    await page.addInitScript((p) => {
      localStorage.setItem(
        "farmart-cart",
        JSON.stringify([
          { product: p, qty: "5" },
          { product: { ...p, id: "bs2" }, qty: 1.5 },
          { product: { ...p, id: "bs3" }, qty: 500 },
        ]),
      );
    }, product);
    await page.goto("/");
    // The two broken lines are dropped and 500 is capped at 99.
    await expect(cartButton(page)).toHaveAccessibleName(/^Your Cart, 99 items,/);
    await snap(page, testInfo, "sanitized cart");
  });

  test("image test: the open drawer matches the baseline", async ({ page }, testInfo) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Add Organic Bananas to cart" }).first().click();
    await cartButton(page).click();
    const drawer = page.getByRole("dialog");
    await expect(drawer).toBeVisible();
    await imagesLoaded(page);
    await matchesBaseline(drawer, testInfo, "cart-drawer.png");
  });
});
