# Farmart codebase map

Synced against: `5c80630` · 2026-10-14 · working tree: clean

Generated and kept current by the `farmart-docs` skill (Sync). Edit it through that procedure; confirm in the source before acting on a line.

## Pages (`src/app/`)

| Route | File | Data source |
|---|---|---|
| `/` | `page.tsx` | SQLite via `src/server/catalog.ts` (banners, categories, top savers, bestsellers, new arrivals) |
| `/search` | `search/page.tsx` | SQLite via `listProducts`, `searchSuggestions` |
| `/products/[id]` | `products/[id]/page.tsx` | **still `src/data`** (`@/data/home`, `@/data/product-details`, `@/data/store`), not SQLite |
| `error` / not found | `error.tsx` | `ErrorPage` component |

Developer pages (hidden in production unless `FARMART_DEV_TOOLS=1`; list in `src/lib/dev-tools.ts` › `DEV_TOOL_PATHS` and `src/proxy.ts`):
`/on-boarding` (live setup status, data pipeline, feature flows: `_components/features.ts`), `/test-report` (`reports/`), `/e2e` (`reports/e2e/`, screenshots via `e2e/shots/[...path]`), `/overview` (UI flow map: `_components/flow-graph.ts`), `/design` and `/design/[slug]` (living design system from `DESIGN.md`), `/docs` (Swagger UI; spec at `/docs/openapi.json`), `/database-er-diagram` (serves `src/server/db/mermaid.html`), `/api/hello`.

## API routes (`src/app/api/`, contract in `openapi.yaml`)

Built (✓ in the spec, every route exports `only("GET")` so other methods get a 405 problem):

| Route | Handler file | Server function |
|---|---|---|
| `GET /api/hello` | `hello/route.ts` | none |
| `GET /api/products` | `products/route.ts` | `listProducts` (search, filter, sort, pages) |
| `GET /api/products/top-savers` | `products/top-savers/route.ts` | `topSavers` |
| `GET /api/products/bestsellers` | `products/bestsellers/route.ts` | `bestsellers` (`period` week/month) |
| `GET /api/products/new-arrivals` | `products/new-arrivals/route.ts` | `newArrivals` |
| `GET /api/products/{id}` | `products/[id]/route.ts` | `getProduct` |
| `GET /api/categories` | `categories/route.ts` | `listCategories` |
| `GET /api/categories/featured` | `categories/featured/route.ts` | `featuredCategories` |
| `GET /api/banners` | `banners/route.ts` | `listBanners` |
| `GET /api/store/settings` | `store/settings/route.ts` | `getStoreSettings` |
| `GET /api/search/suggestions` | `search/suggestions/route.ts` | `searchSuggestions` |
| any other `/api/*` | `[...path]/route.ts` | 404 problem catch-all |

In the spec, not built yet (no ✓): `/api/products/{id}/related`, `/api/auth/{register,login,logout,me}`, `/api/coupons/validate`, `/api/cart`, `/api/cart/items`, `/api/cart/items/{productId}`, `/api/cart/merge`, `/api/cart/coupon`, `/api/orders`, `/api/orders/{id}`, `/api/orders/{id}/cancel`, `/api/wishlist`, `/api/wishlist/{productId}`.

## Server modules (`src/server/`)

- `catalog.ts`: all catalog queries: `getProduct`, `listProducts`, `searchTerms`, `topSavers`, `bestsellers`, `newArrivals`, `listCategories`, `featuredCategories`, `listBanners`, `getStoreSettings`, `dealEndsAt`, `searchSuggestions`; types `CatalogProduct`, `CatalogProductDetail`, `ProductPage`, `PageMeta`, `StoreSettings`.
- `validation.ts`: zod schemas: `productId`, `productQuery` (`PRODUCT_SORTS`), `collectionQuery`, `bestsellerQuery`, `featuredCategoryQuery`, `bannerQuery`, `suggestionQuery`; helpers `queryObject`, `parseLenient`.
- `http.ts`: `api()` wrapper, `ApiError`, `Problem`/`FieldError`, `problemResponse`, `notFound`, `parseQuery`, `parsePath`, `only(...)`.
- `db/client.ts`: `openDb`, `getDb`, `DEFAULT_DB_FILE` (`.data/farmart.sqlite`, or `FARMART_DB`), `DatabaseNotReadyError`.
- `db/status.ts`: `databaseStatus` → `missing | outdated | empty | ready` (used by `/on-boarding`).
- `db/schema.ts`: `SCHEMA`, `SCHEMA_VERSION`.
- `db/mermaid.html`: the ER diagram (checked against the schema by `er-diagram.test.ts`).

## Database (`SCHEMA_VERSION = 1`)

Money in integer cents, converted to dollars at the API edge.

- `categories` (slug PK, name, image, position, featured)
- `products` (id PK, brand, name, category_slug → categories, unit, price_cents, old_price_cents, rating, reviews, image, stock, sold_week, sold_month, created_at)
- `product_details` (product_id PK → products, description, origin, storage, highlights JSON)
- `deals` (product_id PK → products, sold): today's Top Saver deals
- `banners` (id PK, placement hero/hero-side/promo/brand, copy fields, image, href, position, starts_at, ends_at)
- `settings` (key PK, value)

## Shared libs (`src/lib/`) and proxy

- `cart.ts`: `CartItem`, `MAX_QTY` (99), `clampQty`, `sanitizeCart` (checks the cart read back from `localStorage`).
- `search.ts`: `searchHref`, `suggestionOptions`, `SearchOption`.
- `design-md.ts`: `loadDesign`, `DesignTokens`, `ColorDoc` (parses `DESIGN.md`).
- `dev-tools.ts`: `DEV_TOOL_PATHS`, `isDevToolPath`, `devToolsEnabled`.
- `src/proxy.ts`: hides developer pages in production.

## Components (`src/components/`)

| File | Exports | Story |
|---|---|---|
| `ui.tsx` | `Button`, `DiscountBadge`, `CountBadge` | `button`, `badges` |
| `cart-context.tsx` | `CartProvider`, `useCart` (browser cart in `localStorage`) | via `cart-drawer` |
| `cart-drawer.tsx` | `CartDrawer` | yes |
| `cart-toast.tsx` | `CartToast`, `CartToastCard` | yes |
| `countdown.tsx` | `Countdown` | via `home-sections` |
| `dialog.tsx` | `Dialog`, `DialogPanel` | yes |
| `error-page.tsx` | `ErrorPage`, `ErrorPanel` | yes |
| `header.tsx` | `Header`, `BrandLogo` | yes |
| `site-header.tsx` | `SiteHeader` | no |
| `store-chrome.tsx` | `TrustStrip`, `SiteFooter` | yes |
| `home-sections.tsx` | `HeroBanner(s)`, `PromoBanner`, `BrowseCategories`, `CategoryTile`, `FeaturedBrands`, `BrandCard`, `SignupCard`, `SectionTitle`, `Arrows` | yes |
| `product-card.tsx` | `ProductCard`, `CartControl`, `AddPill`, `QtyPill`, `Stars`, `Price`, `SoldBar` | `product-card`, `cart-controls` |
| `pdp.tsx` | `Breadcrumb`, `PriceBlock`, `StockBadge`, `Tag`, `BenefitList`, `Accordion` | yes |
| `product-gallery.tsx` | `ProductGallery` | via `pdp` |
| `product-tabs-section.tsx` | `ProductTabsSection` | no |
| `search-bar.tsx` | `SearchBar`, `SuggestionsPanel` | `search` |
| `search-results.tsx` | `FilterChip`, `Pagination`, `SearchEmpty` | `search` |
| `sort-select.tsx` | `SortSelect` | `search` |
| `design-specimens.tsx` | `CartControlDemo`, `DialogDemo`, `OpenCartButton` (for `/design`) | no |
| `icons.tsx` | icon components | no |

## Seed data (`src/data/`)

- `home.ts`: types `Product`, `Category`, `Banner`, `BannerPlacement`, `SearchSuggestions`; data `categories`, `banners`, `topSaver`, `bestSellers`, `justLanding`, `allProducts`, `sectionTabs`; helpers `slugify`, `discountPercent`, `featuredId`, `getProduct`, `relatedProducts`.
- `product-details.ts`: `productDetails` by product id.
- `store.ts`: `FREE_DELIVERY_FROM` (50), `DELIVERY_FEE` (4.99).
- Pipeline: `src/data/*.ts` → `scripts/seed/seed.ts` → `.data/farmart.sqlite` → `src/server/`. Counts: `farmart-onboard/references/seed-data.md`.

## Scripts and commands

- `scripts/seed/` (`seed.ts`, `cli.ts`): `npm run db:seed`, `db:check`, `db:reset`.
- `scripts/smoke.mjs`: `npm run smoke`. `scripts/capture-overview.mjs`: `npm run overview:shots`. `scripts/graphify.mjs`: `npm run graph`, `graph:setup`, `graphify`.
- Tests: `test:unit`, `test:integration`, `test:backend`, `test:report`, `test:e2e`, `test:e2e:update`, `test:e2e:report`. Others: `dev`, `build`, `start`, `lint`, `lint:fix`, `storybook`, `build-storybook`.

## Tests

- Unit (`src/server/__tests__/unit/`): `cart`, `dev-tools`, `e2e-report`, `er-diagram`, `http`, `search-and-data`, `validation`.
- Integration (`src/server/__tests__/integration/`): `catalog`, `contract`, `database`, `routes`, `status`; setup in `setup-db.ts`, `setup.ts`.
- Seed (`scripts/seed/__tests__/`): unit `seed-data`; integration `check`, `reseed`.
- E2E (`e2e/`): `api`, `cart`, `home`, `product`, `responsive`, `search` specs; `global-setup.ts`, `helpers.ts`; baselines in `e2e/__screenshots__/`.
- Stories: every `*.stories.tsx` (Vitest `storybook` project).

## Plan status (`PLAN.md`)

1. Product Browsing & Category Navigation: ✅
2. Dynamic Homepage & Sales Boosters: 🟡 hero is a single static banner, not a slider
3. Customer Membership & Loyalty: 🟡 UI only
4. Shopping Cart & Order Summary: 🟡 browser cart only

## Skills (`.claude/skills/`)

Project: `farmart-onboard`, `farmart-design-system`, `farmart-backend-feature`, `farmart-code-review`, `farmart-verify`, `farmart-docs`. Third-party: `impeccable`, `graphify`, `grill-me`, `grilling`, caveman family.
