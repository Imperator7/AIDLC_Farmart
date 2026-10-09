/** The browser cart's guard against an edited localStorage value (src/lib/cart.ts). */
import { describe, expect, it } from "vitest";
import { clampQty, MAX_QTY, sanitizeCart } from "@/lib/cart";

const product = (id: string, price = 1.95, oldPrice: number | null = null) => ({ id, price, oldPrice, name: id });
const line = (qty: unknown, p: unknown = product("bs1")) => ({ product: p, qty });

describe("sanitizeCart", () => {
  it("keeps valid lines as they are", () => {
    const items = [line(2), line(1, product("bs2", 4.2, 5))];
    expect(sanitizeCart(items)).toEqual(items);
  });

  it("drops the quantities that once showed as 051.5 items", () => {
    // "5" was added as text ("0" + "5") and 1.5 was kept.
    expect(sanitizeCart([line("5"), line(1.5, product("bs2")), line(0, product("bs3")), line(-2, product("bs4"))])).toEqual([]);
  });

  it("caps a quantity above the limit", () => {
    expect(sanitizeCart([line(1000)])).toEqual([line(MAX_QTY)]);
  });

  it("drops products without an id or a valid price", () => {
    expect(
      sanitizeCart([
        line(1, { price: 1 }),
        line(1, product("")),
        line(1, product("a", -1)),
        line(1, { id: "b", price: "1" }),
        line(1, product("c", 1, Number.NaN)),
        line(1, null),
      ]),
    ).toEqual([]);
  });

  it("keeps the first line of a product listed twice", () => {
    expect(sanitizeCart([line(2), line(7)])).toEqual([line(2)]);
  });

  it("reads anything that isn't a list as an empty cart", () => {
    expect(sanitizeCart({ product: product("bs1"), qty: 1 })).toEqual([]);
    expect(sanitizeCart(null)).toEqual([]);
    expect(sanitizeCart([null, 3, "x"])).toEqual([]);
  });
});

describe("clampQty", () => {
  it("keeps a quantity a whole number from 1 to MAX_QTY", () => {
    expect([clampQty(0), clampQty(3), clampQty(2.7), clampQty(150)]).toEqual([1, 3, 2, MAX_QTY]);
  });
});
