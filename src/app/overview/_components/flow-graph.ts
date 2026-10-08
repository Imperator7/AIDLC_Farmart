import type { Edge, Node } from "@xyflow/react";
import type { ProjectStats } from "./project-summary";

/**
 * The UI map of the whole project (/overview), written by hand from the code.
 * Update it when you add a route, an overlay or a link between them.
 */

export type ScreenKind = "page" | "overlay" | "planned" | "tool";

export type ScreenData = {
  kind: ScreenKind;
  title: string;
  route?: string;
  /** Where the card's Open link goes. Overlays link to the page they open on. */
  href?: string;
  /** Label for the Open link when the route alone doesn't say it (overlays, external tools). */
  hrefLabel?: string;
  file?: string;
  count?: number;
  summary: string;
  parts: string[];
  /** Real screenshot in public/overview (npm run overview:shots). Screens that aren't built use a wireframe. */
  shot?: string;
};

export type LabelData = { title: string; note: string };

export type ScreenNode = Node<ScreenData, "screen">;
export type LabelNode = Node<LabelData, "label">;
export type SummaryNode = Node<{ stats: ProjectStats }, "summary">;
export type FlowNode = ScreenNode | LabelNode | SummaryNode;

export type LinkKind = "navigate" | "overlay" | "planned";
export type FlowEdge = Edge<{ kind: LinkKind }>;

const STORE_Y = 0;
const TOOLS_Y = 860;
const ROW2_Y = 400;
const col = (i: number) => i * 400;

export function buildFlow({ productCount, designPageCount, stats }: { productCount: number; designPageCount: number; stats?: ProjectStats }) {
  const screen = (id: string, x: number, y: number, data: ScreenData): ScreenNode => ({ id, type: "screen", position: { x, y }, data });

  const nodes: FlowNode[] = [
    { id: "label-store", type: "label", position: { x: col(0), y: STORE_Y - 90 }, data: { title: "Storefront", note: "What shoppers see" }, selectable: false, draggable: false },
    { id: "label-tools", type: "label", position: { x: col(0), y: TOOLS_Y - 90 }, data: { title: "Developer tools", note: "Start with On-boarding; design system, stories, API and this map" }, selectable: false, draggable: false },

    screen("home", col(0), STORE_Y, {
      shot: "/overview/home.jpg",
      kind: "page",
      title: "Home",
      route: "/",
      href: "/",
      file: "src/app/page.tsx",
      summary: "Landing page with deals and product rows, served from the SQLite catalog (revalidated every 60s).",
      parts: ["Header + navbar", "Hero & promo banners", "Browse by Category", "Featured Brands", "Top Saver Today + countdown", "Sign-up card", "Best Seller / Just Landing tabs"],
    }),
    screen("pdp", col(1), STORE_Y, {
      shot: "/overview/pdp.jpg",
      kind: "page",
      title: "Product detail",
      route: "/products/[id]",
      href: "/products/ts4",
      file: "src/app/products/[id]/page.tsx",
      count: productCount,
      summary: "One static page per product.",
      parts: ["Header + navbar", "Breadcrumb", "Gallery", "Price, stock, tags", "Add to cart (lg)", "Benefits", "Accordion: description · details · delivery", "You may also like → other products"],
    }),
    screen("cart", col(2), STORE_Y, {
      href: "/",
      hrefLabel: "Open on Home",
      shot: "/overview/cart.jpg",
      kind: "overlay",
      title: "Cart drawer",
      file: "src/components/cart-drawer.tsx",
      summary: "Mounted once in the root layout, so it opens over any store page.",
      parts: ["Free-delivery progress", "Items: stepper · Remove", "Summary: subtotal · discounts · delivery · total", "Checkout", "Clear cart", "Empty state → Continue Shopping"],
    }),
    screen("clear", col(3), STORE_Y, {
      href: "/",
      hrefLabel: "Open on Home",
      shot: "/overview/clear.jpg",
      kind: "overlay",
      title: "Clear cart dialog",
      file: "src/components/dialog.tsx",
      summary: "Danger dialog stacked on the drawer. Focus starts on Cancel.",
      parts: ["Cancel / Esc / backdrop → back to drawer", "Clear cart → empty drawer"],
    }),
    screen("checkout", col(3), ROW2_Y, {
      kind: "planned",
      title: "Checkout",
      summary: "The button exists but does nothing yet.",
      parts: ["Address & delivery slot", "Payment", "Order confirmation"],
    }),
    screen("menu", col(0), ROW2_Y, {
      href: "/",
      hrefLabel: "Open on Home (mobile)",
      shot: "/overview/menu.jpg",
      kind: "overlay",
      title: "Mobile menu",
      file: "src/components/header.tsx",
      summary: "MENU dropdown that replaces the nav links below 1024px.",
      parts: ["Deals Today", "Special Prices", "Fresh · Frozen · Bakery · Drinks", "Blog"],
    }),
    screen("search", col(2), ROW2_Y, {
      shot: "/overview/search.jpg",
      kind: "page",
      title: "Search results",
      route: "/search",
      href: "/search?category=fruits-vegetables",
      file: "src/app/search/page.tsx",
      summary: "Search and the category listing in one page (GET /api/products). Filters live in the URL.",
      parts: ["Header search + autocomplete", "Breadcrumb · title · count", "Sort", "Category / On sale chips", "Product grid", "Empty state", "Pagination"],
    }),
    screen("category", col(4), ROW2_Y, {
      kind: "planned",
      title: "Deal & content pages",
      summary: "The nav links still point to # for now.",
      parts: ["Deals Today / Special Prices", "Brand page", "Blog"],
    }),
    screen("notfound", col(1), ROW2_Y, {
      shot: "/overview/notfound.jpg",
      kind: "page",
      title: "Not found",
      route: "404",
      href: "/products/unknown",
      summary: "Unknown product ids and design slugs (dynamicParams = false).",
      parts: ["Next.js default 404"],
    }),
    screen("error", col(5), ROW2_Y, {
      shot: "/overview/error.jpg",
      kind: "page",
      title: "Error page",
      route: "error.tsx",
      href: "/design/error-page",
      hrefLabel: "See it in /design",
      file: "src/app/error.tsx",
      summary: "Any page that fails on the server (e.g. no database). Customers get Try again and a reference; the real error stays in the server log.",
      parts: ["Logo-only bar", "Try again (recovers without reload)", "Reference = server log digest"],
    }),

    screen("design", col(0), TOOLS_Y, {
      shot: "/overview/design.jpg",
      kind: "tool",
      title: "Design system",
      route: "/design",
      href: "/design",
      file: "src/app/design/page.tsx",
      summary: "Overview generated from DESIGN.md.",
      parts: ["Overview & key characteristics", "Section cards", "Out-of-sync check"],
    }),
    screen("design-page", col(1), TOOLS_Y, {
      shot: "/overview/design-page.jpg",
      kind: "tool",
      title: "Design page",
      route: "/design/[slug]",
      href: "/design/colors",
      file: "src/app/design/[slug]/page.tsx",
      count: designPageCount,
      summary: "Foundations, patterns, components and guidelines.",
      parts: ["Sidebar navigation", "Anatomy · live example · spec", "Previous / next"],
    }),
    screen("overview", col(2), TOOLS_Y, {
      shot: "/overview/overview.jpg",
      kind: "tool",
      title: "UI overview",
      route: "/overview",
      href: "/overview",
      file: "src/app/overview/page.tsx",
      summary: "This map.",
      parts: ["Drag nodes · zoom · minimap", "Click a node for details"],
    }),
    screen("storybook", col(3), TOOLS_Y, {
      href: "http://localhost:6006",
      hrefLabel: "Open Storybook",
      shot: "/overview/storybook.jpg",
      kind: "tool",
      title: "Storybook",
      route: "localhost:6006",
      summary: "Separate dev server (npm run storybook). Every story is also a test.",
      parts: ["Components/*", "Overlays/Dialog · Cart drawer", "Tools/UI overview"],
    }),
    screen("docs", col(4), TOOLS_Y, {
      shot: "/overview/docs.jpg",
      kind: "tool",
      title: "API docs",
      route: "/docs",
      href: "/docs",
      file: "openapi.yaml",
      summary: "Swagger UI for the draft REST API contract; the spec is served at /docs/openapi.json.",
      parts: ["Paths by tag", "Request / response schemas", "Problem (RFC 9457) errors"],
    }),
    screen("erd", col(5), TOOLS_Y, {
      shot: "/overview/erd.jpg",
      kind: "tool",
      title: "Database ER diagram",
      route: "/database-er-diagram",
      href: "/database-er-diagram",
      file: "src/server/db/mermaid.html",
      summary: "Mermaid ERD of the SQLite schema; a unit test keeps it in sync with schema.ts.",
      parts: ["6 tables", "Relationships with cardinality", "Column types, PK / FK / UK"],
    }),
    screen("test-report", col(6), TOOLS_Y, {
      shot: "/overview/test-report.jpg",
      kind: "tool",
      title: "Test report",
      route: "/test-report",
      href: "/test-report",
      file: "src/app/test-report/page.tsx",
      summary: "Readable results of npm run test:report: unit, integration and story tests, plus backend coverage.",
      parts: ["Pass / fail summary", "Failures first, with messages", "Suites → files → features", "Coverage gaps with line numbers"],
    }),
    screen("on-boarding", col(7), TOOLS_Y, {
      shot: "/overview/on-boarding.jpg",
      kind: "tool",
      title: "On-boarding",
      route: "/on-boarding",
      href: "/on-boarding",
      file: "src/app/on-boarding/page.tsx",
      summary: "Start here: live setup checklist, the src/data → seed → SQLite → app pipeline, and how every feature gets its data. Works before seeding.",
      parts: ["Setup steps with live status", "Data pipeline with row counts", "Feature flows, click to data", "API built vs planned (openapi.yaml)"],
    }),
  ];

  const edge = (source: string, target: string, label: string, kind: LinkKind, sourceHandle = "r", targetHandle = "l"): FlowEdge => ({
    id: `${source}-${target}`,
    source,
    target,
    sourceHandle,
    targetHandle,
    label,
    data: { kind },
  });

  const edges: FlowEdge[] = [
    edge("home", "pdp", "Product card image / name", "navigate"),
    edge("pdp", "home", "Logo · breadcrumb", "navigate", "t", "t"),
    edge("pdp", "cart", "Cart icon", "overlay"),
    edge("home", "cart", "Cart icon", "overlay", "t", "t"),
    edge("cart", "clear", "Clear cart", "overlay"),
    edge("cart", "checkout", "Checkout", "planned"),
    edge("home", "menu", "MENU (< 1024px)", "overlay", "b", "t"),
    edge("menu", "category", "Nav links", "planned", "b", "b"),
    edge("home", "search", "Search · category tiles · banners", "navigate", "b", "t"),
    edge("search", "pdp", "Product card · suggestion", "navigate", "t", "b"),
    edge("pdp", "notfound", "Unknown id", "navigate", "b", "t"),
    edge("search", "error", "Server error (e.g. no database)", "navigate", "b", "b"),

    edge("design", "design-page", "Section cards · sidebar", "navigate"),
    edge("design", "home", "← Back to store", "navigate", "l", "l"),
    edge("design", "overview", "UI overview", "navigate", "b", "b"),
    edge("design-page", "pdp", "Product detail specimen", "navigate", "l", "l"),
    edge("overview", "design", "Design system", "navigate", "t", "t"),
    edge("docs", "overview", "UI overview", "navigate", "b", "b"),
    edge("erd", "docs", "API docs", "navigate", "l", "r"),
    edge("on-boarding", "test-report", "Test report", "navigate", "l", "r"),
    edge("on-boarding", "docs", "API docs · Try it in /docs", "navigate", "b", "b"),
  ];

  // The project numbers sit left of the map, top-aligned with the Storefront label.
  if (stats) nodes.unshift({ id: "summary", type: "summary", position: { x: -680, y: STORE_Y - 90 }, data: { stats }, selectable: false });

  return { nodes, edges: edges.map(styleEdge) };
}

export const linkStyles: Record<LinkKind, { color: string; dash?: string; label: string }> = {
  navigate: { color: "#111827", label: "Navigates to a page" },
  overlay: { color: "#f59e0b", dash: "6 4", label: "Opens an overlay" },
  planned: { color: "#9ca3af", dash: "2 4", label: "Not built yet" },
};

function styleEdge(e: FlowEdge): FlowEdge {
  const s = linkStyles[e.data!.kind];
  return {
    ...e,
    type: "smoothstep",
    style: { stroke: s.color, strokeWidth: 1.5, strokeDasharray: s.dash },
    markerEnd: { type: "arrowclosed", color: s.color },
    labelStyle: { fontSize: 11, fill: "#374151" },
    labelBgStyle: { fill: "#ffffff" },
    labelBgPadding: [6, 3],
    labelBgBorderRadius: 4,
  };
}
