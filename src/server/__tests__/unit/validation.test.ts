import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  bannerQuery,
  bestsellerQuery,
  collectionQuery,
  featuredCategoryQuery,
  parseLenient,
  productQuery,
  queryObject,
  suggestionQuery,
} from "../../validation";

describe("queryObject", () => {
  it("reads URLSearchParams and drops blank values", () => {
    expect(queryObject(new URLSearchParams("q=milk&category=&sort=%20%20&page=2"))).toEqual({ q: "milk", page: "2" });
  });

  it("keeps the first of repeated keys", () => {
    expect(queryObject(new URLSearchParams("q=a&q=b"))).toEqual({ q: "a" });
  });

  it("reads Next's searchParams record, including arrays and undefined", () => {
    expect(queryObject({ q: ["milk", "tea"], category: undefined, page: "1" })).toEqual({ q: "milk", page: "1" });
  });
});

describe("productQuery", () => {
  it("fills defaults", () => {
    expect(productQuery.parse({})).toEqual({ sort: "relevance", page: 1, limit: 24 });
  });

  it("coerces numbers and trims text", () => {
    expect(productQuery.parse({ q: "  oat  ", minPrice: "1.5", maxPrice: "9", minRating: "4", page: "3", limit: "10" })).toMatchObject({
      q: "oat",
      minPrice: 1.5,
      maxPrice: 9,
      minRating: 4,
      page: 3,
      limit: 10,
    });
  });

  it("reads onSale only as the words true and false", () => {
    expect(productQuery.parse({ onSale: "true" }).onSale).toBe(true);
    expect(productQuery.parse({ onSale: "false" }).onSale).toBe(false);
    expect(productQuery.safeParse({ onSale: "1" }).success).toBe(false);
  });

  it.each([
    ["q", "x".repeat(101)],
    ["q", "   "],
    ["minPrice", "-1"],
    ["minPrice", "abc"],
    ["minRating", "0"],
    ["minRating", "6"],
    ["minRating", "4.5"],
    ["sort", "cheapest"],
    ["page", "0"],
    ["page", "1.5"],
    ["limit", "0"],
    ["limit", "101"],
    ["category", "x".repeat(65)],
  ])("rejects %s=%s", (key, value) => {
    const result = productQuery.safeParse({ [key]: value });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path[0]).toBe(key);
  });

  it("rejects a reversed price range on maxPrice", () => {
    const result = productQuery.safeParse({ minPrice: "9", maxPrice: "1" });
    expect(result.error?.issues[0].path).toEqual(["maxPrice"]);
    expect(productQuery.safeParse({ minPrice: "5", maxPrice: "5" }).success).toBe(true);
  });
});

describe("collection schemas", () => {
  it("default to 12 items and allow 1–24", () => {
    expect(collectionQuery.parse({})).toEqual({ limit: 12 });
    expect(collectionQuery.safeParse({ limit: "25" }).success).toBe(false);
    expect(collectionQuery.safeParse({ limit: "0" }).success).toBe(false);
  });

  it("bestsellers default to the weekly ranking", () => {
    expect(bestsellerQuery.parse({})).toEqual({ limit: 12, period: "week" });
    expect(bestsellerQuery.parse({ period: "month" }).period).toBe("month");
    expect(bestsellerQuery.safeParse({ period: "year" }).success).toBe(false);
  });

  it("featured categories default to 8", () => {
    expect(featuredCategoryQuery.parse({})).toEqual({ limit: 8 });
  });

  it("banners accept only known placements", () => {
    expect(bannerQuery.parse({ placement: "hero-side" })).toEqual({ placement: "hero-side" });
    expect(bannerQuery.parse({})).toEqual({});
    expect(bannerQuery.safeParse({ placement: "footer" }).success).toBe(false);
  });

  it("suggestions require q and cap the limit at 10", () => {
    expect(suggestionQuery.parse({ q: "mil" })).toEqual({ q: "mil", limit: 5 });
    expect(suggestionQuery.safeParse({}).success).toBe(false);
    expect(suggestionQuery.safeParse({ q: "mil", limit: "11" }).success).toBe(false);
  });
});

describe("parseLenient (pages)", () => {
  it("drops only the invalid fields", () => {
    expect(parseLenient(productQuery, { q: "oat", sort: "cheapest", page: "-2", limit: "12" })).toEqual({
      q: "oat",
      sort: "relevance",
      page: 1,
      limit: 12,
    });
  });

  it("drops a reversed price range but keeps the minimum", () => {
    const query = parseLenient(productQuery, { minPrice: "9", maxPrice: "1" });
    expect(query.minPrice).toBe(9);
    expect(query).not.toHaveProperty("maxPrice");
  });

  it("falls back to the defaults when an error can't be pinned to a field", () => {
    const schema = z.object({ a: z.string().optional() }).refine((v) => v.a !== "x", { message: "No x." });
    expect(parseLenient(schema, { a: "x" })).toEqual({});
  });

  it("returns the input untouched when it is valid", () => {
    expect(parseLenient(productQuery, { q: "oat", onSale: "true" })).toMatchObject({ q: "oat", onSale: true });
  });
});
