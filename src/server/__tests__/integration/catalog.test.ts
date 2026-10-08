/** Repository (src/server/catalog.ts) against a real, freshly seeded SQLite database. */
import { describe, expect, it } from "vitest";
import { getDb } from "../../db/client";
import {
  bestsellers,
  featuredCategories,
  getStoreSettings,
  listBanners,
  listCategories,
  listProducts,
  newArrivals,
  searchSuggestions,
  topSavers,
} from "../../catalog";
import { allProducts, banners, categories } from "@/data/home";
import { productQuery } from "../../validation";

const search = (input: Record<string, string> = {}) => listProducts(productQuery.parse(input));
const ids = (list: { id: string }[]) => list.map((p) => p.id);
const all = () => search({ limit: "100" }).data;

describe("seed", () => {
  it("loads every category, product and banner from src/data", () => {
    expect(listCategories().map((c) => c.slug)).toEqual(categories.map((c) => c.slug));
    expect(ids(all()).sort()).toEqual(ids(allProducts).sort());
    expect(listBanners().map((b) => b.id)).toEqual(banners.map((b) => b.id));
  });

  it("stores money in cents and returns the same dollars", () => {
    for (const p of all()) {
      const source = allProducts.find((s) => s.id === p.id)!;
      expect(p.price).toBe(source.price);
      expect(p.oldPrice).toBe(source.oldPrice ?? null);
    }
  });
});

describe("listProducts: search", () => {
  it("matches name, brand or category, case-insensitively", () => {
    expect(ids(search({ q: "ORANGE" }).data)).toEqual(["ts4"]);
    expect(ids(search({ q: "sunny farm" }).data).sort()).toEqual(["bs1", "ts4"]);
    expect(search({ q: "pet foods" }).data.every((p) => p.category === "Pet Foods")).toBe(true);
  });

  it("requires every word (AND) and ignores extra spaces", () => {
    expect(ids(search({ q: "  beef   mince " }).data)).toEqual(["ts2"]);
    expect(search({ q: "beef banana" }).meta.total).toBe(0);
  });

  it("uses only the first five words", () => {
    expect(ids(search({ q: "beef mince british fat 10% zzz" }).data)).toEqual(["ts2"]);
  });

  it("ranks names starting with (a word of) the query first", () => {
    expect(ids(search({ q: "be" }).data).slice(0, 3)).toEqual(["bs2", "ts2", "ts1"]);
  });

  it("treats LIKE wildcards literally", () => {
    expect(ids(search({ q: "%" }).data)).toEqual(["ts2"]); // "10% Fat"
    expect(search({ q: "_" }).meta.total).toBe(0);
    expect(search({ q: "\\" }).meta.total).toBe(0);
  });

  it("returns an empty page, not an error, for no matches", () => {
    expect(search({ q: "zzz" })).toEqual({ data: [], meta: { page: 1, limit: 24, total: 0, totalPages: 0 } });
  });
});

describe("listProducts: filters", () => {
  it("by category slug", () => {
    expect(ids(search({ category: "pet-foods" }).data)).toEqual(["jl6"]);
    expect(search({ category: "coffees-teas" }).meta.total).toBe(0);
    expect(search({ category: "nope" }).meta.total).toBe(0);
  });

  it("by brand, case-insensitively and exactly", () => {
    expect(search({ brand: "farmart" }).data.every((p) => p.brand === "Farmart")).toBe(true);
    expect(search({ brand: "farm" }).meta.total).toBe(0);
  });

  it("by sale state", () => {
    const sale = search({ onSale: "true", limit: "100" }).data;
    const full = search({ onSale: "false", limit: "100" }).data;
    expect(sale.length + full.length).toBe(16);
    expect(sale.every((p) => p.oldPrice! > p.price && p.discountPercent > 0)).toBe(true);
    expect(full.every((p) => p.oldPrice === null && p.discountPercent === 0)).toBe(true);
  });

  it("by price range, inclusive", () => {
    const inRange = search({ minPrice: "2.5", maxPrice: "4.2", limit: "100" }).data.map((p) => p.price);
    expect(inRange).toContain(2.5);
    expect(inRange).toContain(4.2);
    expect(inRange.every((p) => p >= 2.5 && p <= 4.2)).toBe(true);
  });

  it("by minimum rating", () => {
    expect(search({ minRating: "5", limit: "100" }).data.every((p) => p.rating === 5)).toBe(true);
  });

  it("combines filters with AND", () => {
    expect(ids(search({ q: "farm", category: "breads-sweets", onSale: "true" }).data)).toEqual(["bs4"]);
  });
});

describe("listProducts: sorting and paging", () => {
  const order = (sort: string) => search({ sort, limit: "100" }).data;

  it.each([
    ["price_asc", (a: number, b: number) => a - b, "price"],
    ["price_desc", (a: number, b: number) => b - a, "price"],
    ["rating_desc", (a: number, b: number) => b - a, "rating"],
    ["discount_desc", (a: number, b: number) => b - a, "discountPercent"],
  ] as const)("%s", (sort, compare, field) => {
    const values = order(sort).map((p) => p[field] as number);
    expect(values).toEqual([...values].sort(compare));
  });

  it("newest puts New Arrivals first", () => {
    expect(ids(order("newest")).slice(0, 6)).toEqual(["jl1", "jl2", "jl3", "jl4", "jl5", "jl6"]);
  });

  it("bestselling (and relevance without q) puts Best Sellers first", () => {
    const top = ["bs1", "bs2", "bs3", "bs4", "bs5", "bs6"];
    expect(ids(order("bestselling")).slice(0, 6)).toEqual(top);
    expect(ids(order("relevance")).slice(0, 6)).toEqual(top);
  });

  it("is stable: ties break by id, so pages never overlap", () => {
    const pages = [1, 2, 3, 4].flatMap((page) => ids(search({ sort: "rating_desc", limit: "5", page: String(page) }).data));
    expect(new Set(pages).size).toBe(16);
  });

  it("reports paging in meta, including past the last page", () => {
    expect(search({ limit: "5", page: "4" })).toMatchObject({ meta: { page: 4, limit: 5, total: 16, totalPages: 4 } });
    expect(search({ limit: "5", page: "4" }).data).toHaveLength(1);
    expect(search({ limit: "5", page: "9" }).data).toEqual([]);
  });
});

describe("product shape", () => {
  it("adds categorySlug, discountPercent and inStock", () => {
    expect(search({ q: "blood oranges" }).data[0]).toEqual({
      id: "ts4",
      brand: "Sunny Farm",
      name: "Blood Oranges, Sweet & Juicy",
      category: "Fruits & Vegetables",
      categorySlug: "fruits-vegetables",
      unit: "1kg",
      price: 4.15,
      oldPrice: 4.9,
      discountPercent: 15,
      rating: 4,
      reviews: 5,
      image: expect.stringContaining("images.unsplash.com"),
      stock: 60,
      sold: 32,
      inStock: true,
    });
  });

  it("has `sold` only for today's deals", () => {
    const withSold = all().filter((p) => "sold" in p);
    expect(ids(withSold).sort()).toEqual(["ts1", "ts2", "ts3", "ts4"]);
  });

  it("is out of stock when the deal is sold out or stock is 0", () => {
    const db = getDb();
    db.prepare("UPDATE deals SET sold = 60 WHERE product_id = 'ts4'").run();
    db.prepare("UPDATE products SET stock = 0 WHERE id = 'bs1'").run();
    try {
      expect(search({ q: "blood oranges" }).data[0].inStock).toBe(false);
      expect(search({ q: "bananas" }).data[0].inStock).toBe(false);
    } finally {
      db.prepare("UPDATE deals SET sold = 32 WHERE product_id = 'ts4'").run();
      db.prepare("UPDATE products SET stock = 100 WHERE id = 'bs1'").run();
    }
  });
});

describe("home collections", () => {
  it("top savers: today's deals, biggest saving first, with the deal end", () => {
    const { data, endsAt } = topSavers({ limit: 12 });
    expect(ids(data)).toEqual(["ts4", "ts1", "ts2", "ts3"]);
    expect(Date.parse(endsAt)).toBeGreaterThan(Date.now());
    expect(Date.parse(endsAt) - Date.now()).toBeLessThanOrEqual(86_400_000);
  });

  it("top savers: limit and category", () => {
    expect(topSavers({ limit: 2 }).data).toHaveLength(2);
    expect(ids(topSavers({ category: "raw-meats", limit: 12 }).data)).toEqual(["ts2"]);
  });

  it("best sellers: weekly and monthly ranking, by category", () => {
    expect(ids(bestsellers({ period: "week", limit: 6 }).data)).toEqual(["bs1", "bs2", "bs3", "bs4", "bs5", "bs6"]);
    expect(ids(bestsellers({ period: "month", limit: 3 }).data)).toEqual(["bs1", "bs2", "bs3"]);
    expect(bestsellers({ period: "week", category: "raw-meats", limit: 12 }).data.every((p) => p.categorySlug === "raw-meats")).toBe(true);
  });

  it("new arrivals: newest first, by category", () => {
    expect(ids(newArrivals({ limit: 6 }).data)).toEqual(["jl1", "jl2", "jl3", "jl4", "jl5", "jl6"]);
    expect(ids(newArrivals({ category: "pet-foods", limit: 6 }).data)).toEqual(["jl6"]);
  });
});

describe("categories", () => {
  it("lists every category in display order with product counts", () => {
    const list = listCategories();
    expect(list).toHaveLength(8);
    expect(list.find((c) => c.slug === "fruits-vegetables")?.productCount).toBe(3);
    expect(list.find((c) => c.slug === "coffees-teas")?.productCount).toBe(0);
    expect(list.reduce((n, c) => n + c.productCount!, 0)).toBe(16);
  });

  it("featured: only featured ones, up to the limit", () => {
    expect(featuredCategories(3).map((c) => c.slug)).toEqual(["fruits-vegetables", "breads-sweets", "frozen-seafoods"]);
    getDb().prepare("UPDATE categories SET featured = 0 WHERE slug = 'pet-foods'").run();
    try {
      expect(featuredCategories(8).map((c) => c.slug)).not.toContain("pet-foods");
    } finally {
      getDb().prepare("UPDATE categories SET featured = 1 WHERE slug = 'pet-foods'").run();
    }
  });
});

describe("banners", () => {
  it("filters by placement and keeps position order", () => {
    expect(listBanners("hero").map((b) => b.id)).toEqual(["bnr_hero_juice"]);
    expect(listBanners("brand")).toHaveLength(4);
    expect(listBanners("promo")).toEqual([]);
  });

  it("returns the API shape", () => {
    expect(listBanners("hero")[0]).toMatchObject({ imageAlt: expect.any(String), ctaLabel: "Shop Now", startsAt: null, endsAt: null, position: 1 });
  });

  it("only shows banners inside their schedule", () => {
    const db = getDb();
    const insert = db.prepare(
      "INSERT INTO banners (id, placement, title, image, image_alt, href, position, starts_at, ends_at) VALUES (?, 'brand', 't', 'x', 'x', '/', 99, ?, ?)",
    );
    insert.run("past", null, "2020-01-01T00:00:00Z");
    insert.run("future", "2999-01-01T00:00:00Z", null);
    insert.run("now", "2020-01-01T00:00:00Z", "2999-01-01T00:00:00Z");
    try {
      const shown = listBanners("brand").map((b) => b.id);
      expect(shown).toContain("now");
      expect(shown).not.toContain("past");
      expect(shown).not.toContain("future");
      expect(listBanners("brand", new Date("3000-01-01T00:00:00Z")).map((b) => b.id)).toContain("future");
    } finally {
      db.prepare("DELETE FROM banners WHERE id IN ('past', 'future', 'now')").run();
    }
  });
});

describe("store settings", () => {
  it("returns the delivery terms in dollars", () => {
    expect(getStoreSettings()).toEqual({ currency: "USD", freeDeliveryFrom: 50, deliveryFee: 4.99, memberDiscountPercent: 15 });
  });

  it("falls back to safe defaults when settings are missing", () => {
    const db = getDb();
    const saved = db.prepare("SELECT key, value FROM settings").all() as { key: string; value: string }[];
    db.exec("DELETE FROM settings");
    try {
      expect(getStoreSettings()).toEqual({ currency: "USD", freeDeliveryFrom: 0, deliveryFee: 0, memberDiscountPercent: 0 });
      expect(topSavers({ limit: 1 }).endsAt).toMatch(/T00:00:00\.000Z$/); // no time_zone → UTC midnight
    } finally {
      const insert = db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)");
      for (const s of saved) insert.run(s.key, s.value);
    }
  });
});

describe("searchSuggestions", () => {
  it("returns compact products and matching categories", () => {
    expect(searchSuggestions("milk")).toEqual({
      query: "milk",
      products: [{ id: "jl5", name: "Fresh Whole Milk 1L", image: expect.any(String), price: 1.5 }],
      categories: [{ slug: "milks-dairies", name: "Milks & Dairies" }],
    });
  });

  it("respects the product limit and caps categories at 3", () => {
    const s = searchSuggestions("s", 2);
    expect(s.products).toHaveLength(2);
    expect(s.categories.length).toBeLessThanOrEqual(3);
  });

  it("matches categories by every word", () => {
    expect(searchSuggestions("frozen sea").categories).toEqual([{ slug: "frozen-seafoods", name: "Frozen Seafoods" }]);
    expect(searchSuggestions("frozen meat").categories).toEqual([]);
  });

  it("escapes wildcards in category matching too", () => {
    expect(searchSuggestions("%").categories).toEqual([]);
  });
});
