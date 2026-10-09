/**
 * Contract: real responses must match openapi.yaml, and every implemented (✓) operation must have a route.
 * Object schemas are made strict (no undocumented fields) so the spec can't silently fall behind the code.
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020";
import addFormats from "ajv-formats";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { GET as getBanners } from "@/app/api/banners/route";
import { GET as getFeaturedCategories } from "@/app/api/categories/featured/route";
import { GET as getCategories } from "@/app/api/categories/route";
import { GET as getHello } from "@/app/api/hello/route";
import { GET as getBestsellers } from "@/app/api/products/bestsellers/route";
import { GET as getProduct } from "@/app/api/products/[id]/route";
import { GET as getNewArrivals } from "@/app/api/products/new-arrivals/route";
import { GET as getProducts, POST as postProducts } from "@/app/api/products/route";
import { GET as getTopSavers } from "@/app/api/products/top-savers/route";
import { GET as getSuggestions } from "@/app/api/search/suggestions/route";
import { GET as getSettings } from "@/app/api/store/settings/route";

type Schema = Record<string, unknown>;
type Spec = { paths: Record<string, Record<string, { summary?: string }>>; components: { schemas: Record<string, unknown> } } & Schema;

const root = process.cwd();
const spec = parse(readFileSync(path.join(root, "openapi.yaml"), "utf8")) as Spec;

const OPEN = "__open";

/**
 * Makes the spec strict, so undocumented fields fail:
 * - plain object schemas get additionalProperties: false;
 * - an allOf gets unevaluatedProperties: false, which sees the fields of all its members together, and its
 *   members (and the components they $ref, via an open copy) stay open, or they would reject each other's fields.
 */
function strict(node: unknown, inAllOf = false): unknown {
  if (Array.isArray(node)) return node.map((n) => strict(n, inAllOf));
  if (!node || typeof node !== "object") return node;
  const ref = (node as Schema).$ref;
  if (inAllOf && typeof ref === "string" && ref.startsWith("#/components/schemas/")) return { ...node, $ref: ref + OPEN };
  const out: Schema = {};
  for (const [key, value] of Object.entries(node)) out[key] = strict(value, key === "allOf");
  if (out.allOf && !("unevaluatedProperties" in out)) out.unevaluatedProperties = false;
  else if (out.properties && !("additionalProperties" in out) && !inAllOf) out.additionalProperties = false;
  return out;
}

/** The strict spec plus an open copy of every component schema, for allOf members to point at. */
function strictSpec(source: Spec): Schema {
  const out = strict(source) as Spec;
  for (const [name, schema] of Object.entries(source.components.schemas)) out.components.schemas[name + OPEN] = strict(schema, true);
  return out;
}

const ajv = new Ajv2020({ strict: false, allErrors: true });
addFormats(ajv);
ajv.addFormat("password", true);
ajv.addSchema({ ...strictSpec(spec), $id: "openapi" });

const pointer = (...parts: string[]) => parts.map((p) => p.replace(/~/g, "~0").replace(/\//g, "~1")).join("/");

/** Validates a response against the schema the spec declares for that path, status and content type. */
function expectMatchesSpec(apiPath: string, status: number, contentType: string, body: unknown) {
  const operation = spec.paths[apiPath]?.get as { responses?: Record<string, { $ref?: string }> } | undefined;
  const response = operation?.responses?.[String(status)];
  expect(response, `${apiPath} ${status} is not in openapi.yaml`).toBeDefined();
  // A response may be a $ref to components/responses.
  const target = response!.$ref ? `openapi${response!.$ref}` : `openapi#/${pointer("paths", apiPath, "get", "responses", String(status))}`;
  const validate = ajv.getSchema(`${target}/${pointer("content", contentType, "schema")}`);
  expect(validate, `${apiPath} ${status} has no ${contentType} schema`).toBeDefined();
  const ok = validate!(body);
  expect(ok, `${apiPath} ${status}: ${ajv.errorsText(validate!.errors)}`).toBe(true);
}

type Handler = (request: Request, context: never) => Response | Promise<Response>;

type Case = [specPath: string, handler: Handler, query: string, params?: Record<string, string>];

const cases: Case[] = [
  ["/api/hello", getHello, ""],
  ["/api/products", getProducts, "?q=be&sort=price_asc&limit=5"],
  ["/api/products/top-savers", getTopSavers, ""],
  ["/api/products/bestsellers", getBestsellers, "?period=month"],
  ["/api/products/new-arrivals", getNewArrivals, ""],
  ["/api/categories", getCategories, ""],
  ["/api/categories/featured", getFeaturedCategories, ""],
  ["/api/banners", getBanners, ""],
  ["/api/store/settings", getSettings, ""],
  ["/api/search/suggestions", getSuggestions, "?q=milk"],
  ["/api/products/{id}", getProduct, "", { id: "bs5" }],
];

const invalid: Case[] = [
  ["/api/products", getProducts, "?limit=0"],
  ["/api/products/top-savers", getTopSavers, "?limit=99"],
  ["/api/products/bestsellers", getBestsellers, "?period=year"],
  ["/api/products/new-arrivals", getNewArrivals, "?limit=x"],
  ["/api/categories/featured", getFeaturedCategories, "?limit=0"],
  ["/api/banners", getBanners, "?placement=x"],
  ["/api/search/suggestions", getSuggestions, ""],
  ["/api/products/{id}", getProduct, "", { id: "x".repeat(65) }],
];

const missing: Case[] = [["/api/products/{id}", getProduct, "", { id: "nope" }]];

const run = async (handler: Handler, apiPath: string, query: string, params: Record<string, string> = {}) => {
  const url = apiPath.replace(/{(\w+)}/g, (_, key: string) => params[key]) + query;
  const res = await handler(new Request(`http://localhost${url}`), { params: Promise.resolve(params) } as never);
  return { res, body: await res.json() };
};

describe("responses match openapi.yaml", () => {
  it.each(cases)("200 %s", async (apiPath, handler, query, params) => {
    const { res, body } = await run(handler, apiPath, query, params);
    expect(res.status).toBe(200);
    expectMatchesSpec(apiPath, 200, "application/json", body);
  });

  it.each(invalid)("422 %s is a Problem", async (apiPath, handler, query, params) => {
    const { res, body } = await run(handler, apiPath, query, params);
    expect(res.status).toBe(422);
    expectMatchesSpec(apiPath, 422, "application/problem+json", body);
  });

  it.each(missing)("404 %s is a Problem", async (apiPath, handler, query, params) => {
    const { res, body } = await run(handler, apiPath, query, params);
    expect(res.status).toBe(404);
    expectMatchesSpec(apiPath, 404, "application/problem+json", body);
  });

  it("405 is a Problem (components/responses/MethodNotAllowed)", async () => {
    const res = await postProducts(new Request("http://localhost/api/products", { method: "POST" }), undefined as never);
    expect(res.status).toBe(405);
    const validate = ajv.getSchema(`openapi#/${pointer("components", "responses", "MethodNotAllowed", "content", "application/problem+json", "schema")}`)!;
    expect(validate(await res.json()), ajv.errorsText(validate.errors)).toBe(true);
  });

  it("the strict check also covers allOf schemas (a $ref'd member plus extra fields)", () => {
    const validate = ajv.getSchema("openapi#/components/schemas/ProductDetail")!;
    const product = { id: "bs5", brand: "Farmart", name: "Cookies", category: "Breads & Sweets", categorySlug: "breads-sweets", unit: "300g", price: 4.2, oldPrice: null, discountPercent: 0, rating: 5, reviews: 18, image: "https://images.unsplash.com/x", stock: 100, inStock: true };
    const detail = { ...product, description: "d", origin: "o", storage: "s", highlights: ["h"] };
    expect(validate(detail), ajv.errorsText(validate.errors)).toBe(true);
    expect(validate({ ...detail, secret: 1 })).toBe(false);
  });

  it("the strict check catches an undocumented field", () => {
    const validate = ajv.getSchema("openapi#/components/schemas/StoreSettings")!;
    expect(validate({ currency: "USD", freeDeliveryFrom: 50, deliveryFee: 4.99, memberDiscountPercent: 15 })).toBe(true);
    expect(validate({ currency: "USD", freeDeliveryFrom: 50, deliveryFee: 4.99, memberDiscountPercent: 15, secret: 1 })).toBe(false);
  });
});

describe("spec and routes agree", () => {
  /** /api route files → their URL paths ("[...path]" is the NOT_FOUND catch-all, not an endpoint). */
  function routePaths(dir = path.join(root, "src", "app", "api"), prefix = "/api"): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      if (entry.isFile()) return entry.name === "route.ts" ? [prefix] : [];
      if (entry.name.startsWith("[...")) return [];
      return routePaths(path.join(dir, entry.name), `${prefix}/${entry.name.replace(/^\[(.+)\]$/, "{$1}")}`);
    });
  }

  const implemented = Object.entries(spec.paths)
    .filter(([p, ops]) => p.startsWith("/api") && Object.values(ops).some((op) => op.summary?.endsWith("✓")))
    .map(([p]) => p);

  it("every /api route is documented and marked ✓", () => {
    for (const p of routePaths()) {
      expect(spec.paths[p], `${p} is missing from openapi.yaml`).toBeDefined();
      expect(implemented, `${p} is implemented but not marked ✓`).toContain(p);
    }
  });

  it("every operation marked ✓ has a route", () => {
    expect(implemented.sort()).toEqual(routePaths().sort());
  });

  it("every route in the contract cases is covered here", () => {
    expect(cases.map(([p]) => p).sort()).toEqual(implemented.sort());
  });
});
