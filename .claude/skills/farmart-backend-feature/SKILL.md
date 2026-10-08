---
name: farmart-backend-feature
description: Build Farmart backend features the repo's way - add or change an /api endpoint spec-first (openapi.yaml → zod → src/server query → thin route handler → integration + contract tests → ✓), add or change a SQLite table (schema.ts, SCHEMA_VERSION, seed, ER diagram, db:reset), or move a page from the mock files in src/data onto SQLite. Use for any work in src/app/api, src/server, src/server/db/schema.ts or openapi.yaml, and for backlog items like product detail, cart, orders, auth or wishlist endpoints. Not for UI (farmart-design-system) or first-time setup and seeding (farmart-onboard).
---

# Farmart backend features

The backend lives in the Next.js app: route handlers in `src/app/api/`, logic in `src/server/`, data in SQLite through `node:sqlite`. Three rules shape every change:

1. **Spec first.** `openapi.yaml` is the contract. Change it before the code; the contract test fails when code and spec disagree.
2. **Thin handlers.** A route handler validates and calls one `src/server/` function. SQL and business rules live in `src/server/`.
3. **The backend only reads what the seed wrote.** `src/server/` never seeds; new tables get their starting data from `src/data` through `scripts/seed/seed.ts`.

Pick the workflow, follow its steps in order, and finish with **Done means** at the end. Code templates for every step are in [references/templates.md](references/templates.md); copy them rather than inventing a new shape.

## Workflow A: add or change an endpoint

1. **Spec** (`openapi.yaml`)
   - Planned operations are already drafted (`/docs` lists them; `/on-boarding` › API shows built vs planned). Read the drafted operation, its parameters, schemas and responses, and fix the draft if it's wrong before writing code.
   - Responses: every 4xx/5xx is a `$ref` to `components/responses` and uses the `Problem` schema (`application/problem+json`). Any query parameter means a `422` response.
   - Don't add the ✓ yet.
   - `npx @redocly/cli lint openapi.yaml` must pass.
2. **Validation** (`src/server/validation.ts`): a zod schema per query shape, exported with its `z.infer` type. Copy the existing conventions: `z.coerce.number()` for numbers, the `bool` helper (never `z.coerce.boolean`), `.trim()` and `.max()` on strings, `.default()` for documented defaults. Defaults and limits must equal the spec's.
3. **Query** (`src/server/catalog.ts`, or a new `src/server/<area>.ts` for a new area such as cart or orders)
   - Read through `getDb()`; reuse `SELECT_PRODUCT` and `toProduct` for anything that returns products, so every product has the same shape.
   - Money is integer cents in SQL and dollars in the result (`dollars()`).
   - Expected failures throw `new ApiError(status, CODE, title, detail)` with the **specific** `CODE` from the error-code table at the top of `openapi.yaml`, matching the response the operation `$ref`s. An unknown product is `PRODUCT_NOT_FOUND`, not `NOT_FOUND`; `notFound()` in `http.ts` is the generic code for unknown routes. Never return `null` for the handler to translate.
   - Named SQL parameters: `node:sqlite` rejects unused ones; build optional filters with `stripUnused` like `listProducts`.
4. **Route** (`src/app/api/<path>/route.ts`): `export const GET = api(...)`, one line or close to it. Path parameters arrive as `ctx.params` (a Promise) typed with the global `RouteContext<"/api/products/[id]">`; run `npx next typegen` after creating the folder so the type exists. JSON bodies (POST/PUT/PATCH): use `parseBody` from `http.ts`; if it doesn't exist yet, add it as shown in the templates (400 for broken JSON, 422 for invalid fields).
5. **Integration test** (`src/server/__tests__/integration/routes.test.ts`): call the real handler with a real `Request`. Cover the happy path with seed values (see `farmart-onboard/references/seed-data.md`), each 4xx the spec lists, and the `Problem` shape. Logic-heavy queries also get cases in `catalog.test.ts`.
6. **Contract test** (`src/server/__tests__/integration/contract.test.ts`): add the route to `cases` (200) and, if it has query parameters, to `invalid` (422). The harness was written for GET without path parameters and without `allOf` responses; the first endpoint that needs `{id}`, a body or an `allOf` schema extends it as shown in the templates (each extension is a few lines and keeps every existing row working). Don't skip the row: the "every ✓ route has a case" test fails without it.
7. **Mark it built:** add ` ✓` to the end of the operation's `summary` in `openapi.yaml`.
8. **Callers:**
   - A **page** that needs the data calls the `src/server/` function directly, never `fetch("/api/…")` from the server.
   - A **client component** uses the `/api` route.
   - If a feature now gets its data differently, update its flow in `src/app/on-boarding/_components/features.ts`.
   - Any UI work goes through the `farmart-design-system` skill.

## Workflow B: add or change a table

1. **Schema** (`src/server/db/schema.ts`): `CREATE TABLE IF NOT EXISTS`, with constraints that encode the rules (`CHECK`, `REFERENCES … ON DELETE CASCADE` where children die with the parent, `UNIQUE`). Money columns end in `_cents` and are `INTEGER`. Add indexes for the columns you filter or sort on. **Bump `SCHEMA_VERSION`.**
2. **Starting data:**
   - If the table needs rows to develop against, add them to `src/data/*.ts` (the source), then insert them in `seed()` in `scripts/seed/seed.ts`.
   - Add the table to `TABLES` (children before parents) and to the `KEY` map (its identifying column; `db:check` compares rows by it).
   - Extend `findSeedProblems` for any new rule the schema enforces, so bad data gets a readable message instead of `CHECK constraint failed`.
   - Tables that only hold user data (carts, orders) start empty: add them to `TABLES` and `KEY` but insert nothing.
3. **ER diagram** (`src/server/db/mermaid.html`): an entity block with every column (`TYPE name PK/FK "note"`) and a relationship line per foreign key. `er-diagram.test.ts` fails until it matches.
4. **Tests:**
   - `database.test.ts` › schema constraints: one rejected insert per new `CHECK`/foreign key.
   - The seed tests in `scripts/seed/__tests__/` (counts in `reseed.test.ts`, `check.test.ts`).
   - `status.test.ts` (`SEEDED` table list).
5. **Rebuild:** stop the dev server, `npm run db:reset`, then `npm run db:check`. Update `farmart-onboard/references/seed-data.md` and its expected-row table if the starting data changed.

A table for a new feature is usually followed by Workflow A for its endpoints.

## Workflow C: move a page from mock data to SQLite

Today the product page (`src/app/products/[id]/page.tsx`) reads `src/data` directly. To move a page:

1. Make sure the data is in SQLite (Workflow B) and a `src/server/` function returns it (Workflow A steps 2–5; the API route is optional for a page, but the backlog wants both).
2. In the page, replace the `@/data/...` imports with the `src/server/` call. Keep `generateStaticParams` if the page is pre-rendered; it now reads SQLite at build time (the build already requires a seeded database).
3. Not found: call `notFound()` from `next/navigation` in the page when the function says the item doesn't exist.
4. Update the feature's card in `src/app/on-boarding/_components/features.ts` (source `"sqlite"`, the steps, the tests) and the AGENTS.md line that says the page still reads `src/data`.
5. Keep `src/data` itself: it's the seed source and feeds stories and `/design` specimens.

## Done means

Run these, in this order, and fix before moving on:

```bash
npx @redocly/cli lint openapi.yaml
npm run test:backend
npx tsc --noEmit
npm run lint
```

- `test:backend` must pass with **100% of lines** covered. An uncovered line is either a missing test or dead code.
- After a schema change, also `npm run db:reset` (dev server stopped) and `npm run db:check`.
- If a page changed, run `npm run build` and look for warnings, not only errors. For example, a dynamic file path in `src/server` makes Turbopack trace the whole project; mark `process.cwd()` with `/* turbopackIgnore: true */` as `client.ts` does.
- Try the endpoint once for real: `curl -i http://localhost:3000/api/...`. Check the status, the `X-Request-Id` header and the JSON, plus one bad request (expect a `Problem`).
- `/on-boarding` › API should now count the operation as built.

## Mistakes this repo has already made

- **A response the spec forgot.** The contract test once found a `422` missing from `/api/categories/featured`. Every operation with query parameters needs a `422`, and every lookup by id needs a `404`.
- **`allOf` responses fail the contract test until the harness is extended.** `ProductDetail` (`allOf: [$ref Product, …]`) can never pass the original strict check: the `$ref`'d `Product` rejects the detail fields. The templates' `strictSpec` fixes it with `unevaluatedProperties`. Also assert the exact keys in the integration test; that check caught a forgotten field while this skill was being tested.
- **The generic error code.** The spec gives most 404s and 409s their own code (`PRODUCT_NOT_FOUND`, `OUT_OF_STOCK`, …). The contract test only checks the `Problem` shape, so assert the exact `code` in the integration test.
- **A forgotten `KEY` entry.** `db:check` can't compare a table it has no key for.
- **A forgotten ER diagram.** The test catches it, but update `mermaid.html` in the same change.
- **Importing `src/server` into a `"use client"` file.** It breaks the build ("Attempted to call … from the server"). Helpers both sides need go in `src/lib/`.
- **Testing against the real database.** Integration tests get a seeded in-memory database from `setup-db.ts`. Tests that need a file use a temp directory, never `.data/`.
