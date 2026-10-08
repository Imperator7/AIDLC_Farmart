import type { DevTool, Feature } from "./types";

/**
 * How each feature gets its data, written by hand. Keep it in step with the code: when a feature moves from mock
 * data to SQLite, or gets a new route, update its steps here (and the UI overview's flow-graph.ts).
 */
export const features: Feature[] = [
  {
    id: "home",
    title: "Home page",
    href: "/",
    hrefLabel: "Open /",
    source: "sqlite",
    summary: "Banners, Top Saver deals with a countdown, Best Sellers, New Arrivals and the category circles.",
    response: "HTML on first load; RSC payload (?_rsc=) when you navigate back to it",
    steps: [
      { layer: "browser", title: "GET /" },
      { layer: "page", title: "Server Component", file: "src/app/page.tsx", note: "Cached; rebuilt at most every 60 s" },
      {
        layer: "server",
        title: "listBanners · topSavers · bestsellers · newArrivals · featuredCategories",
        file: "src/server/catalog.ts",
        note: "Called directly, no HTTP",
      },
      { layer: "database", title: "banners · products · deals · categories · settings" },
    ],
    tests: "catalog.test.ts",
  },
  {
    id: "search",
    title: "Search results",
    href: "/search?q=oat",
    hrefLabel: "Open /search?q=oat",
    source: "sqlite",
    summary: "Full results for a query or category, with filter chips, sorting and pages. Pressing Enter in the search box lands here.",
    response: "HTML on first load; RSC payload (?_rsc=) when you search from inside the app",
    steps: [
      { layer: "browser", title: "GET /search?q=oat&sort=…&page=…" },
      { layer: "page", title: "Server Component", file: "src/app/search/page.tsx", note: "Runs on every request" },
      { layer: "server", title: "parseLenient(productQuery)", file: "src/server/validation.ts", note: "Bad parameters are dropped, not errors" },
      { layer: "server", title: "listProducts · listCategories", file: "src/server/catalog.ts", note: "Every word must match name, brand or category" },
      { layer: "database", title: "products · categories · deals" },
    ],
    tests: "catalog.test.ts",
  },
  {
    id: "suggestions",
    title: "Search suggestions",
    href: "/",
    hrefLabel: "Type in the header search box",
    source: "sqlite",
    summary: "The dropdown under the search box: up to 5 products and 3 categories while you type.",
    response: "JSON from GET /api/search/suggestions",
    steps: [
      { layer: "client", title: "Search box (client component)", file: "src/components/search-bar.tsx", note: "Waits 150 ms after typing, cancels stale requests" },
      { layer: "route", title: "GET /api/search/suggestions?q=…", file: "src/app/api/search/suggestions/route.ts", note: "api() wrapper + zod; bad input is a 422 Problem" },
      { layer: "server", title: "searchSuggestions", file: "src/server/catalog.ts" },
      { layer: "database", title: "products · categories" },
    ],
    tests: "routes.test.ts · contract.test.ts · search.stories.tsx",
  },
  {
    id: "api",
    title: "Catalog REST API",
    href: "/docs",
    hrefLabel: "Try it in /docs",
    source: "sqlite",
    summary: "Products, deals, best sellers, new arrivals, categories, banners and store settings as JSON, for client code and other apps.",
    response: "JSON; errors are application/problem+json with a stable code; every response has X-Request-Id",
    steps: [
      { layer: "client", title: "fetch, curl or Swagger UI" },
      { layer: "route", title: "Route handlers", file: "src/app/api/**/route.ts", note: "Thin: parseQuery(zod) then one catalog call" },
      { layer: "server", title: "catalog.ts", file: "src/server/catalog.ts", note: "Money is stored in cents, returned in dollars" },
      { layer: "database", title: "All 6 tables" },
    ],
    tests: "routes.test.ts · contract.test.ts (responses must match openapi.yaml)",
  },
  {
    id: "product",
    title: "Product page",
    href: "/products/bs5",
    hrefLabel: "Open /products/bs5",
    source: "mock",
    summary: "Gallery, price, stock, details and related products. Not on SQLite yet: it reads the seed data files directly.",
    response: "Static HTML, built by npm run build for every product",
    steps: [
      { layer: "browser", title: "GET /products/bs5" },
      { layer: "page", title: "Server Component", file: "src/app/products/[id]/page.tsx", note: "Pre-rendered at build time" },
      { layer: "source", title: "allProducts · productDetails", file: "src/data/home.ts · product-details.ts", note: "Same files the seed reads; an edit shows here without seeding" },
    ],
    tests: "Stories only (pdp components)",
  },
  {
    id: "cart",
    title: "Cart",
    href: "/",
    hrefLabel: "Add any product",
    source: "browser",
    summary: "Add, change and remove items; the drawer, the toast and the delivery threshold. It never talks to the server yet.",
    response: "Nothing: no request is made",
    steps: [
      { layer: "client", title: "Add / + / − buttons", file: "src/components/product-card.tsx" },
      { layer: "client", title: "Cart state (React context)", file: "src/components/cart-context.tsx", note: "Delivery fee and free-delivery threshold from src/data/store.ts" },
      { layer: "storage", title: 'localStorage "farmart-cart"', note: "Survives a reload, only in this browser" },
    ],
    tests: "cart-controls, cart-drawer and cart-toast stories",
  },
];

export const devTools: DevTool[] = [
  { title: "API docs", href: "/docs", reads: "openapi.yaml", about: "Swagger UI for every endpoint; ✓ marks the built ones." },
  { title: "Database ER diagram", href: "/database-er-diagram", reads: "src/server/db/mermaid.html", about: "The 6 tables and how they relate." },
  { title: "Test report", href: "/test-report", reads: "reports/ (npm run test:report)", about: "Every test and the backend coverage." },
  { title: "Design system", href: "/design", reads: "DESIGN.md", about: "Tokens, components and rules for any UI change." },
  { title: "UI overview", href: "/overview", reads: "flow-graph.ts + screenshots", about: "Every screen and how they link." },
  { title: "Storybook", href: "http://localhost:6006", external: true, reads: "*.stories.tsx (npm run storybook)", about: "Each component on its own; every story is a test." },
];

export const commands = [
  { command: "npm run db:seed", when: "Set up, or put the starting data back. Safe while the dev server runs." },
  { command: "npm run db:check", when: "Does my database still match src/data? Lists every difference." },
  { command: "npm run db:reset", when: "After a schema change. Stop the dev server first." },
  { command: "npm run dev", when: "Start the app at http://localhost:3000." },
  { command: "npm run test:report", when: "Run every test, then read /test-report." },
  { command: "npm run lint · npx tsc --noEmit", when: "Before a pull request, with the story tests and npm run build." },
];
