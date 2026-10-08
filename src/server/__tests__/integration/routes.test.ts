/** Every route handler end to end: Request → validation → repository → SQLite → Response. */
import { describe, expect, it } from "vitest";
import * as missing from "@/app/api/[...path]/route";
import { GET as getBanners } from "@/app/api/banners/route";
import { GET as getFeaturedCategories } from "@/app/api/categories/featured/route";
import { GET as getCategories } from "@/app/api/categories/route";
import { GET as getHello } from "@/app/api/hello/route";
import { GET as getBestsellers } from "@/app/api/products/bestsellers/route";
import { GET as getProduct } from "@/app/api/products/[id]/route";
import { GET as getNewArrivals } from "@/app/api/products/new-arrivals/route";
import { GET as getProducts } from "@/app/api/products/route";
import { GET as getTopSavers } from "@/app/api/products/top-savers/route";
import { GET as getSuggestions } from "@/app/api/search/suggestions/route";
import { GET as getSettings } from "@/app/api/store/settings/route";
import { GET as getErd } from "@/app/database-er-diagram/route";
import { GET as getMermaid } from "@/app/database-er-diagram/mermaid.min.js/route";
import { GET as getOpenApi } from "@/app/docs/openapi.json/route";

type Handler = (request: Request, context: never) => Response | Promise<Response>;

async function call(handler: Handler, url: string, init?: RequestInit) {
  const res = await handler(new Request(`http://localhost${url}`, init), undefined as never);
  const type = res.headers.get("Content-Type") ?? "";
  const body = type.includes("json") ? await res.json() : await res.text();
  return { res, status: res.status, type, body, requestId: res.headers.get("X-Request-Id") };
}

/** Shared expectations for a 422 problem. */
async function expectInvalid(handler: Handler, url: string, fields: string[]) {
  const { status, type, body, requestId } = await call(handler, url);
  expect(status).toBe(422);
  expect(type).toBe("application/problem+json");
  expect(body).toMatchObject({ code: "VALIDATION_FAILED", status: 422, instance: new URL(url, "http://x").pathname, requestId });
  expect(body.errors.map((e: { field: string }) => e.field).sort()).toEqual([...fields].sort());
}

describe("GET /api/products", () => {
  it("searches and pages", async () => {
    const { status, type, body, requestId } = await call(getProducts, "/api/products?q=oat");
    expect(status).toBe(200);
    expect(type).toBe("application/json");
    expect(requestId).toMatch(/^req_/);
    expect(body).toEqual({ data: [expect.objectContaining({ id: "bs5", name: "Homemade Oatmeal Cookies" })], meta: { page: 1, limit: 24, total: 1, totalPages: 1 } });
  });

  it("applies every filter and sort from the query string", async () => {
    const { body } = await call(getProducts, "/api/products?category=fruits-vegetables&onSale=true&minPrice=1&maxPrice=5&minRating=4&sort=price_desc&limit=2&page=1");
    expect(body.data.map((p: { id: string }) => p.id)).toEqual(["ts4", "bs3"]);
    expect(body.meta).toEqual({ page: 1, limit: 2, total: 2, totalPages: 1 });
  });

  it("treats blank parameters as absent", async () => {
    const { status, body } = await call(getProducts, "/api/products?q=&category=&sort=");
    expect(status).toBe(200);
    expect(body.meta.total).toBe(16);
  });

  it("returns 422 for every invalid parameter at once", async () => {
    await expectInvalid(getProducts, "/api/products?limit=0&page=x&sort=cheapest&onSale=yes&minRating=9", ["limit", "page", "sort", "onSale", "minRating"]);
  });

  it("returns 422 for a reversed price range", async () => {
    await expectInvalid(getProducts, "/api/products?minPrice=9&maxPrice=1", ["maxPrice"]);
  });
});

/** `call` passes no route context; this variant passes params the way Next does. */
const withParams = (params: Record<string, string>) => ({ params: Promise.resolve(params) }) as never;

describe("GET /api/products/{id}", () => {
  it("returns the product with its details", async () => {
    const res = await getProduct(new Request("http://localhost/api/products/bs5"), withParams({ id: "bs5" }));
    expect(res.status).toBe(200);
    expect(res.headers.get("X-Request-Id")).toMatch(/^req_/);
    const body = await res.json();
    expect(Object.keys(body).sort()).toEqual(
      ["brand", "category", "categorySlug", "description", "discountPercent", "highlights", "id", "image", "inStock", "name", "oldPrice", "origin", "price", "rating", "reviews", "stock", "storage", "unit"].sort(),
    );
    expect(body).toMatchObject({ id: "bs5", name: "Homemade Oatmeal Cookies", price: 4.2, categorySlug: "breads-sweets" });
    expect(body.highlights.length).toBeGreaterThan(0);
  });

  it("includes today's deal count for a Top Saver", async () => {
    const res = await getProduct(new Request("http://localhost/api/products/ts1"), withParams({ id: "ts1" }));
    expect(await res.json()).toMatchObject({ id: "ts1", sold: 35 });
  });

  it("answers an unknown id with PRODUCT_NOT_FOUND", async () => {
    const res = await getProduct(new Request("http://localhost/api/products/nope"), withParams({ id: "nope" }));
    expect(res.status).toBe(404);
    expect(res.headers.get("Content-Type")).toBe("application/problem+json");
    expect(await res.json()).toMatchObject({ code: "PRODUCT_NOT_FOUND", status: 404, instance: "/api/products/nope" });
  });
});

describe("GET /api/products/top-savers", () => {
  it("returns today's deals and endsAt", async () => {
    const { status, body } = await call(getTopSavers, "/api/products/top-savers?limit=2");
    expect(status).toBe(200);
    expect(body.data.map((p: { id: string }) => p.id)).toEqual(["ts4", "ts1"]);
    expect(body.endsAt).toMatch(/T17:00:00\.000Z$/); // midnight in Asia/Bangkok
  });

  it("validates limit", async () => {
    await expectInvalid(getTopSavers, "/api/products/top-savers?limit=25", ["limit"]);
  });
});

describe("GET /api/products/bestsellers", () => {
  it("ranks by period and filters by category", async () => {
    const { body } = await call(getBestsellers, "/api/products/bestsellers?period=month&limit=3");
    expect(body.data.map((p: { id: string }) => p.id)).toEqual(["bs1", "bs2", "bs3"]);
    const { body: meats } = await call(getBestsellers, "/api/products/bestsellers?category=raw-meats");
    expect(meats.data.every((p: { categorySlug: string }) => p.categorySlug === "raw-meats")).toBe(true);
  });

  it("validates period", async () => {
    await expectInvalid(getBestsellers, "/api/products/bestsellers?period=year", ["period"]);
  });
});

describe("GET /api/products/new-arrivals", () => {
  it("returns the newest first", async () => {
    const { body } = await call(getNewArrivals, "/api/products/new-arrivals?limit=2");
    expect(body).toEqual({ data: [expect.objectContaining({ id: "jl1" }), expect.objectContaining({ id: "jl2" })] });
  });

  it("validates limit", async () => {
    await expectInvalid(getNewArrivals, "/api/products/new-arrivals?limit=abc", ["limit"]);
  });
});

describe("GET /api/categories and /featured", () => {
  it("lists every category", async () => {
    const { status, body } = await call(getCategories, "/api/categories");
    expect(status).toBe(200);
    expect(body.data).toHaveLength(8);
    expect(body.data[0]).toEqual({ slug: "fruits-vegetables", name: "Fruits & Vegetables", image: expect.any(String), productCount: 3 });
  });

  it("lists featured categories up to the limit", async () => {
    const { body } = await call(getFeaturedCategories, "/api/categories/featured?limit=2");
    expect(body.data.map((c: { slug: string }) => c.slug)).toEqual(["fruits-vegetables", "breads-sweets"]);
    await expectInvalid(getFeaturedCategories, "/api/categories/featured?limit=0", ["limit"]);
  });
});

describe("GET /api/banners", () => {
  it("lists all active banners, or one placement", async () => {
    expect((await call(getBanners, "/api/banners")).body.data).toHaveLength(6);
    const { body } = await call(getBanners, "/api/banners?placement=hero-side");
    expect(body.data).toEqual([expect.objectContaining({ id: "bnr_side_veg", title: "20% OFF", href: "/search?category=fruits-vegetables&onSale=true" })]);
  });

  it("validates placement", async () => {
    await expectInvalid(getBanners, "/api/banners?placement=footer", ["placement"]);
  });
});

describe("GET /api/store/settings", () => {
  it("returns the delivery terms", async () => {
    expect((await call(getSettings, "/api/store/settings")).body).toEqual({ currency: "USD", freeDeliveryFrom: 50, deliveryFee: 4.99, memberDiscountPercent: 15 });
  });
});

describe("GET /api/search/suggestions", () => {
  it("suggests products and categories", async () => {
    const { status, body } = await call(getSuggestions, "/api/search/suggestions?q=milk&limit=3");
    expect(status).toBe(200);
    expect(body.products.map((p: { id: string }) => p.id)).toEqual(["jl5"]);
    expect(body.categories).toEqual([{ slug: "milks-dairies", name: "Milks & Dairies" }]);
  });

  it("requires q", async () => {
    const { body } = await call(getSuggestions, "/api/search/suggestions");
    expect(body.errors).toEqual([{ field: "q", code: "REQUIRED", message: "q is required." }]);
  });

  it("validates q length and limit", async () => {
    await expectInvalid(getSuggestions, `/api/search/suggestions?q=${"x".repeat(101)}&limit=11`, ["q", "limit"]);
  });
});

describe("unknown /api paths", () => {
  it.each(["GET", "POST", "PUT", "PATCH", "DELETE"] as const)("%s answers NOT_FOUND as a problem", async (method) => {
    const { status, type, body } = await call(missing[method], "/api/cart", { method });
    expect(status).toBe(404);
    expect(type).toBe("application/problem+json");
    expect(body).toMatchObject({ code: "NOT_FOUND", detail: `No endpoint ${method} /api/cart. See /docs for the API.` });
  });
});

describe("other routes", () => {
  it("GET /api/hello", async () => {
    expect((await call(getHello, "/api/hello")).body).toEqual({ message: "Hello, world!" });
  });

  it("GET /docs/openapi.json serves the spec as JSON", async () => {
    const { status, body } = await call(getOpenApi, "/docs/openapi.json");
    expect(status).toBe(200);
    expect(body.openapi).toBe("3.1.0");
    expect(Object.keys(body.paths)).toContain("/api/products");
  });

  it("GET /database-er-diagram serves the Mermaid page", async () => {
    const { status, type, body } = await call(getErd, "/database-er-diagram");
    expect(status).toBe(200);
    expect(type).toBe("text/html; charset=utf-8");
    expect(body).toContain("erDiagram");
    expect(body).toContain('src="/database-er-diagram/mermaid.min.js"');
  });

  it("GET /database-er-diagram/mermaid.min.js serves Mermaid from node_modules", async () => {
    const { status, type, res, body } = await call(getMermaid, "/database-er-diagram/mermaid.min.js");
    expect(status).toBe(200);
    expect(type).toBe("text/javascript; charset=utf-8");
    expect(res.headers.get("Cache-Control")).toBe("public, max-age=86400");
    expect(body.length).toBeGreaterThan(1_000_000);
  });
});
