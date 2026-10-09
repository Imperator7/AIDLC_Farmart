import { expect, test } from "@playwright/test";

/** The API and production behaviour through real HTTP: the regressions fixed in the 2026-10-09 review. */
test.describe("API and production behaviour", () => {
  test("search returns JSON with a request id", async ({ request }) => {
    const res = await request.get("/api/products?q=oat");
    expect(res.status()).toBe(200);
    expect(res.headers()["x-request-id"]).toMatch(/^req_/);
    expect((await res.json()).data.map((p: { id: string }) => p.id)).toEqual(["bs5"]);
  });

  test("regression: q=%00 is a 422, not every product", async ({ request }) => {
    const res = await request.get("/api/products?q=%00");
    expect(res.status()).toBe(422);
    expect(res.headers()["content-type"]).toBe("application/problem+json");
    expect(await res.json()).toMatchObject({ code: "VALIDATION_FAILED", errors: [{ field: "q" }] });
  });

  test("regression: page past 10000 and an id past 64 characters are 422", async ({ request }) => {
    expect((await request.get("/api/products?page=10001")).status()).toBe(422);
    expect((await request.get(`/api/products/${"x".repeat(65)}`)).status()).toBe(422);
  });

  test("regression: an unsupported method is a 405 problem with Allow", async ({ request }) => {
    const res = await request.post("/api/products");
    expect(res.status()).toBe(405);
    expect(res.headers()["allow"]).toBe("GET, HEAD, OPTIONS");
    expect(await res.json()).toMatchObject({ code: "METHOD_NOT_ALLOWED" });
  });

  test("an unknown product is PRODUCT_NOT_FOUND", async ({ request }) => {
    const res = await request.get("/api/products/nope");
    expect(res.status()).toBe(404);
    expect(await res.json()).toMatchObject({ code: "PRODUCT_NOT_FOUND" });
  });

  test("developer pages are hidden in production", async ({ request }) => {
    for (const path of ["/on-boarding", "/test-report", "/e2e", "/design", "/docs", "/overview", "/database-er-diagram"])
      expect((await request.get(path)).status(), path).toBe(404);
    expect(await (await request.get("/api/hello")).json()).toMatchObject({ code: "NOT_FOUND" });
  });

  test("security headers are set", async ({ request }) => {
    const headers = (await request.get("/")).headers();
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["strict-transport-security"]).not.toContain("preload");
    expect(headers["x-powered-by"]).toBeUndefined();
  });
});
