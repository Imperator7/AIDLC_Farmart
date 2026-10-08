# Templates

Copy these and rename. Each one matches the code already in the repo; if the repo has moved on, follow the repo.

## Contents

1. [Spec: an operation](#1-spec-an-operation)
2. [Validation: a query schema](#2-validation-a-query-schema)
3. [Query: a src/server function](#3-query-a-srcserver-function)
4. [Route handlers](#4-route-handlers) (plain, with a path parameter, with a JSON body)
5. [parseBody (first endpoint with a body)](#5-parsebody-first-endpoint-with-a-body)
6. [Integration test](#6-integration-test)
7. [Contract test: rows and the harness extensions](#7-contract-test)
8. [A new table](#8-a-new-table) (schema, seed, KEY, ER diagram, tests)

## 1. Spec: an operation

```yaml
  /api/products/{id}:
    get:
      tags: [Catalog]
      operationId: getProduct
      summary: Product detail ✓          # add " ✓" only when the route, tests and contract row exist
      parameters:
        - $ref: "#/components/parameters/ProductId"
      responses:
        "200":
          description: The product with its long-form content
          content:
            application/json:
              schema: { $ref: "#/components/schemas/ProductDetail" }
        "404": { $ref: "#/components/responses/ProductNotFound" }   # lookups by id
        "422": { $ref: "#/components/responses/ValidationFailed" }  # only if it has query parameters
        "500": { $ref: "#/components/responses/InternalError" }
```

Check the response names under `components/responses` before using one; add a new one there (with a `Problem` example and its `code`) rather than inlining.

## 2. Validation: a query schema

```ts
// src/server/validation.ts
/** GET /api/products/{id}/related. */
export const relatedQuery = z.object({ limit: z.coerce.number().int().min(1).max(24).default(6) });
export type RelatedQuery = z.infer<typeof relatedQuery>;
```

Path parameters are not validated with zod; the query function decides whether the id exists.

## 3. Query: a src/server function

```ts
// src/server/catalog.ts
import { ApiError } from "./http";

export type CatalogProductDetail = CatalogProduct & { description: string; origin: string; storage: string; highlights: string[] };

type DetailRow = ProductRow & { description: string; origin: string; storage: string; highlights: string };

/** GET /api/products/{id}: the product with its long-form content (openapi.yaml › ProductDetail). */
export function getProduct(id: string): CatalogProductDetail {
  const row = getDb()
    .prepare(
      `SELECT p.id, p.brand, p.name, p.category_slug, c.name AS category_name, p.unit, p.price_cents, p.old_price_cents,
              p.rating, p.reviews, p.image, p.stock, d.sold AS deal_sold,
              coalesce(pd.description, '') AS description, coalesce(pd.origin, '') AS origin,
              coalesce(pd.storage, '') AS storage, coalesce(pd.highlights, '[]') AS highlights
       FROM products p
       JOIN categories c ON c.slug = p.category_slug
       LEFT JOIN deals d ON d.product_id = p.id
       LEFT JOIN product_details pd ON pd.product_id = p.id
       WHERE p.id = ?`,
    )
    .get(id) as DetailRow | undefined;
  if (!row) throw new ApiError(404, "PRODUCT_NOT_FOUND", "Product not found", `No product with id "${id}".`);
  return { ...toProduct(row), description: row.description, origin: row.origin, storage: row.storage, highlights: JSON.parse(row.highlights) as string[] };
}
```

- Write the SQL out rather than editing `SELECT_PRODUCT` with string replaces (it's unreadable), and keep the column aliases `toProduct` expects (`category_name`, `deal_sold`).
- `LEFT JOIN` optional children (details, deals) so a product without them still exists; a missing *product* is the only 404.
- `http.ts` imports nothing from `catalog.ts`, so importing `ApiError` here is safe.
- JSON columns (`highlights`) are stored as text; parse them here, not in the handler.

## 4. Route handlers

Plain (query parameters only):

```ts
// src/app/api/products/top-savers/route.ts
import { topSavers } from "@/server/catalog";
import { api, parseQuery } from "@/server/http";
import { collectionQuery } from "@/server/validation";

/** GET /api/products/top-savers: today's deals and when they end. */
export const GET = api((request) => Response.json(topSavers(parseQuery(request, collectionQuery))));
```

With a path parameter (`src/app/api/products/[id]/route.ts`; run `npx next typegen` once so `RouteContext` knows the route):

```ts
import { getProduct } from "@/server/catalog";
import { api } from "@/server/http";

/** GET /api/products/{id}: one product with its long-form content. */
export const GET = api(async (_request, ctx: RouteContext<"/api/products/[id]">) => Response.json(getProduct((await ctx.params).id)));
```

With a JSON body:

```ts
/** POST /api/cart/items: add a product to the signed-in member's cart. */
export const POST = api(async (request) => Response.json(addCartItem(await parseBody(request, cartItemBody)), { status: 201 }));
```

Status codes come from the spec: `201` for creates, `204` with `new Response(null, { status: 204 })` for deletes.

## 5. parseBody (first endpoint with a body)

Add to `src/server/http.ts` next to `parseQuery`, and unit-test it in `http.test.ts` (broken JSON, wrong field, success):

```ts
/** Reads a JSON body: 400 BAD_REQUEST when it isn't JSON, 422 VALIDATION_FAILED with per-field errors when it doesn't match. */
export async function parseBody<T extends z.ZodType>(request: Request, schema: T): Promise<z.infer<T>> {
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    throw new ApiError(400, "BAD_REQUEST", "Malformed request", "The request body must be valid JSON.");
  }
  const result = schema.safeParse(input);
  if (!result.success) throw validationError(result.error); // share the field mapping with parseQuery
  return result.data;
}
```

Refactor `parseQuery`'s error mapping into a shared `validationError(error)` first, so query and body errors look identical.

## 6. Integration test

```ts
// src/server/__tests__/integration/routes.test.ts
import { GET as getProduct } from "@/app/api/products/[id]/route";

/** `call` passes no route context; this variant passes params the way Next does. */
const withParams = (params: Record<string, string>) => ({ params: Promise.resolve(params) }) as never;

describe("GET /api/products/{id}", () => {
  it("returns the product with its details", async () => {
    const res = await getProduct(new Request("http://localhost/api/products/bs5"), withParams({ id: "bs5" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Object.keys(body).sort()).toEqual([/* every documented key, sorted: allOf schemas aren't checked strictly */]);
    expect(body).toMatchObject({ id: "bs5", name: "Homemade Oatmeal Cookies", price: 4.2 });
  });

  it("answers an unknown id with PRODUCT_NOT_FOUND", async () => {
    const res = await getProduct(new Request("http://localhost/api/products/nope"), withParams({ id: "nope" }));
    expect(res.status).toBe(404);
    expect(res.headers.get("Content-Type")).toBe("application/problem+json");
    expect(await res.json()).toMatchObject({ code: "PRODUCT_NOT_FOUND", status: 404, instance: "/api/products/nope" });
  });
});
```

Use seed values from `farmart-onboard/references/seed-data.md` (bs5 = Homemade Oatmeal Cookies, $4.20).

## 7. Contract test

`src/server/__tests__/integration/contract.test.ts` has three lists: `cases` (200), `invalid` (422) and the route-vs-spec checks. Each row is `[specPath, handler, query]`.

**Rows for a GET with query parameters:**

```ts
["/api/products/top-savers", getTopSavers, ""],          // in cases
["/api/products/top-savers", getTopSavers, "?limit=99"], // in invalid
```

**First endpoint with a path parameter:** add an optional 4th element, `params`, and let `run` build the URL from the spec path and pass the route context:

```ts
type Case = [specPath: string, handler: Handler, query: string, params?: Record<string, string>];

const run = async (handler: Handler, apiPath: string, query: string, params: Record<string, string> = {}) => {
  const url = apiPath.replace(/\{(\w+)\}/g, (_, key: string) => params[key]) + query;
  const res = await handler(new Request(`http://localhost${url}`), { params: Promise.resolve(params) } as never);
  return { res, body: await res.json() };
};

// cases:  ["/api/products/{id}", getProduct, "", { id: "bs5" }]
```

Type `cases` and `invalid` as `Case[]`, and update the two `it.each` callbacks to call `run(handler, apiPath, query, params)`.

**404s against the spec:** add a list for lookups by id, so the `404` response in the spec is checked too:

```ts
const missing: Case[] = [["/api/products/{id}", getProduct, "", { id: "nope" }]];

it.each(missing)("404 %s is a Problem", async (apiPath, handler, query, params) => {
  const { res, body } = await run(handler, apiPath, query, params);
  expect(res.status).toBe(404);
  expectMatchesSpec(apiPath, 404, "application/problem+json", body);
});
```

**First response that uses `allOf` with a `$ref`** (for example `ProductDetail` = `Product` + details): the harness's `strict()` makes every component reject unknown fields, so the `$ref`'d `Product` rejects `description` and the response can never pass. Replace `strict` with this version, and use `strictSpec(spec)` in `ajv.addSchema`. It points `$ref`s inside an `allOf` at an open copy of the component and puts `unevaluatedProperties: false` on the `allOf` itself, which checks the combined object strictly:

```ts
type Spec = { paths: Record<string, Record<string, { summary?: string }>>; components: { schemas: Record<string, unknown> } } & Schema;

const OPEN = "__open";

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

// ajv.addSchema({ ...strictSpec(spec), $id: "openapi" });
```

Add a test that proves it both ways: a valid `ProductDetail` passes, and the same object plus `secret: 1` fails.

**First non-GET endpoint:** `expectMatchesSpec` reads `spec.paths[apiPath]?.get`. Give it a `method` argument (default `"get"`), use it in the lookup and in the JSON pointer, and add the method and body to the case rows.

## 8. A new table

Schema (`src/server/db/schema.ts`, then bump `SCHEMA_VERSION`):

```sql
CREATE TABLE IF NOT EXISTS cart_items (
  member_id   TEXT NOT NULL REFERENCES members (id) ON DELETE CASCADE,
  product_id  TEXT NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  qty         INTEGER NOT NULL CHECK (qty BETWEEN 1 AND 99),
  added_at    TEXT NOT NULL,
  PRIMARY KEY (member_id, product_id)
);
CREATE INDEX IF NOT EXISTS cart_items_member ON cart_items (member_id);
```

Seed (`scripts/seed/seed.ts`):

```ts
export const TABLES = ["cart_items", "deals", /* … children before parents … */ "settings"] as const;

const KEY: Record<(typeof TABLES)[number], string> = {
  cart_items: "member_id",   // for a composite key, pick a column and see the note below
  // …
};
```

`compareWithSeed` matches rows by one `KEY` column. For a composite primary key, either give the table a single `id` column or change `compareWithSeed` to join several columns into the key; don't let two rows share a key silently.

ER diagram (`src/server/db/mermaid.html`, inside the `erDiagram` block):

```
    cart_items {
        TEXT member_id PK, FK "members.id"
        TEXT product_id PK, FK "products.id"
        INTEGER qty "1 to 99"
        TEXT added_at "ISO 8601"
    }

    products ||--o{ cart_items : "is in"
```

Schema-constraint tests (`src/server/__tests__/integration/database.test.ts`): one `it.each` row per rule, for example a `qty` of 0 must throw `/CHECK/`, an unknown `product_id` must throw `/FOREIGN KEY/`.

Then update the expected tables wherever the seed's shape is asserted: `reseed.test.ts` (`SEED_COUNTS`), `status.test.ts` (`SEEDED`), `check.test.ts` if the new table has seed rows.
