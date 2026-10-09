import { describe, expect, it } from "vitest";
import { dealEndsAt, searchTerms } from "../../catalog";
import { discountPercent, featuredId, slugify, type Product } from "@/data/home";
import { searchHref, suggestionOptions } from "@/lib/search";

const product = (id: string, price: number, oldPrice?: number | null): Product => ({
  id,
  brand: "B",
  name: id,
  category: "C",
  unit: "1",
  price,
  oldPrice,
  rating: 4,
  reviews: 1,
  image: "x",
});

describe("searchHref", () => {
  it("builds /search with only the filled filters", () => {
    expect(searchHref({ q: "oat", category: undefined, sort: "", page: "2" })).toBe("/search?q=oat&page=2");
    expect(searchHref({})).toBe("/search");
    expect(searchHref({ q: "   " })).toBe("/search");
  });

  it("encodes values", () => {
    expect(searchHref({ brand: "Tea Joy", q: "a&b" })).toBe("/search?brand=Tea+Joy&q=a%26b");
  });
});

describe("suggestionOptions", () => {
  const data = {
    query: "mil",
    products: [{ id: "jl5", name: "Fresh Whole Milk 1L", image: "x", price: 1.5 }],
    categories: [{ slug: "milks-dairies", name: "Milks & Dairies" }],
  };

  it("orders products, then categories, then 'Search for'", () => {
    expect(suggestionOptions(data).map((o) => [o.kind, o.href])).toEqual([
      ["product", "/products/jl5"],
      ["category", "/search?category=milks-dairies"],
      ["search", "/search?q=mil"],
    ]);
  });

  it("keeps the selected category on 'Search for'", () => {
    expect(suggestionOptions(data, "milks-dairies").at(-1)?.href).toBe("/search?q=mil&category=milks-dairies");
  });

  it("returns nothing when nothing matched", () => {
    expect(suggestionOptions({ query: "zzz", products: [], categories: [] })).toEqual([]);
  });
});

describe("searchTerms", () => {
  it("lowercases and splits on any whitespace", () => {
    expect(searchTerms("  Fresh\tMILK ")).toEqual(["fresh", "milk"]);
  });

  it("keeps the 5 longest words, in the order they were typed", () => {
    // The 6th word used to be dropped whatever it was, so "oat" never counted.
    expect(searchTerms("a b c d e f oat")).toEqual(["a", "b", "c", "d", "oat"]);
    expect(searchTerms("x milk yy bread zzz cheese q")).toEqual(["milk", "yy", "bread", "zzz", "cheese"]);
  });

  it("keeps everything when there are 5 words or fewer", () => {
    expect(searchTerms("a b c")).toEqual(["a", "b", "c"]);
    expect(searchTerms("")).toEqual([]);
  });
});

describe("dealEndsAt", () => {
  it("is the next midnight in the given time zone", () => {
    expect(dealEndsAt(new Date("2026-10-07T08:00:00Z"), "Asia/Bangkok")).toBe("2026-10-07T17:00:00.000Z");
    expect(dealEndsAt(new Date("2026-10-07T23:59:59Z"), "UTC")).toBe("2026-10-08T00:00:00.000Z");
  });

  it("rolls over at local midnight exactly", () => {
    // 17:00Z is 00:00 in Bangkok, so the deal that just started ends a day later.
    expect(dealEndsAt(new Date("2026-10-07T17:00:00Z"), "Asia/Bangkok")).toBe("2026-10-08T17:00:00.000Z");
  });

  it("handles month and year ends", () => {
    expect(dealEndsAt(new Date("2026-12-31T20:00:00Z"), "Asia/Bangkok")).toBe("2027-01-01T17:00:00.000Z");
  });

  it("uses the zone's offset on that day (daylight saving)", () => {
    // New York is UTC-4 in summer and UTC-5 in winter.
    expect(dealEndsAt(new Date("2026-07-01T12:00:00Z"), "America/New_York")).toBe("2026-07-02T04:00:00.000Z");
    expect(dealEndsAt(new Date("2026-01-15T12:00:00Z"), "America/New_York")).toBe("2026-01-16T05:00:00.000Z");
  });
});

describe("data helpers", () => {
  it("slugify makes URL-safe category slugs", () => {
    expect(slugify("Fruits & Vegetables")).toBe("fruits-vegetables");
    expect(slugify("Wines & Alcohol Drinks")).toBe("wines-alcohol-drinks");
    expect(slugify("  Coffees & Teas!  ")).toBe("coffees-teas");
  });

  it("discountPercent rounds the saving and is 0 without an old price", () => {
    expect(discountPercent(product("a", 4.15, 4.9))).toBe(15);
    expect(discountPercent(product("b", 2, null))).toBe(0);
    expect(discountPercent(product("c", 2))).toBe(0);
  });

  it("featuredId picks the biggest saving, or none", () => {
    expect(featuredId([product("a", 9, 10), product("b", 5, 10), product("c", 1)])).toBe("b");
    expect(featuredId([product("a", 1), product("b", 2)])).toBeUndefined();
    expect(featuredId([])).toBeUndefined();
  });
});
