// Captures real screenshots of every built screen for the /overview map (public/overview/<id>.jpg).
// Needs the dev server (npm run dev) and, for the Storybook shot, npm run storybook.
// Usage: npm run overview:shots            (every screen)
//        npm run overview:shots -- docs erd  (only these ids)
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const STORYBOOK = process.env.STORYBOOK_URL ?? "http://localhost:6006";
const OUT = "public/overview";

const desktop = { width: 1280, height: 800 };
const mobile = { width: 390, height: 844 };

/** Adds a few products through the real UI so the drawer has content. */
async function fillCart(page) {
  const adds = page.getByRole("button", { name: /^Add .* to cart$/ });
  await adds.nth(0).click();
  await page.getByRole("button", { name: /^Increase / }).first().click();
  await adds.nth(0).click();
  await adds.nth(0).click();
}

const openCart = (page) => page.getByRole("button", { name: /^Your Cart/ }).click();

const shots = [
  { id: "home", url: "/" },
  { id: "pdp", url: "/products/ts4" },
  {
    id: "cart",
    url: "/",
    steps: async (p) => {
      await fillCart(p);
      await openCart(p);
    },
  },
  {
    id: "clear",
    url: "/",
    steps: async (p) => {
      await fillCart(p);
      await openCart(p);
      await p.getByRole("button", { name: "Clear cart" }).click();
    },
  },
  { id: "menu", url: "/", viewport: mobile, steps: (p) => p.getByRole("button", { name: "Toggle menu" }).click() },
  { id: "notfound", url: "/products/unknown" },
  // Only reachable when the server fails, so it's shot from its story.
  { id: "error", url: `${STORYBOOK}/iframe.html?id=components-error-page--production&viewMode=story` },
  { id: "search", url: "/search?category=fruits-vegetables" },
  { id: "design", url: "/design" },
  { id: "design-page", url: "/design/buttons" },
  { id: "overview", url: "/overview" },
  { id: "docs", url: "/docs" },
  { id: "erd", url: "/database-er-diagram" },
  { id: "test-report", url: "/test-report" },
  { id: "e2e", url: "/e2e" },
  { id: "on-boarding", url: "/on-boarding" },
  { id: "storybook", url: `${STORYBOOK}/?path=/story/components-product-card--row` },
];

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
let failed = 0;

// Ids given on the command line limit the run to those screens.
const only = process.argv.slice(2);
const unknown = only.filter((id) => !shots.some((s) => s.id === id));
if (unknown.length) throw new Error(`Unknown screen id: ${unknown.join(", ")}. Ids: ${shots.map((s) => s.id).join(", ")}`);

for (const s of shots.filter((s) => !only.length || only.includes(s.id))) {
  const context = await browser.newContext({ viewport: s.viewport ?? desktop });
  const page = await context.newPage();
  try {
    await page.goto(s.url.startsWith("http") ? s.url : BASE + s.url, { waitUntil: "networkidle" });
    await page.addStyleTag({ content: "nextjs-portal{display:none!important}" }); // hide the Next.js dev indicator
    if (s.steps) await s.steps(page);
    await page.waitForTimeout(800); // overlay transitions, Storybook boot
    await page.waitForFunction(() => [...document.images].every((i) => i.complete), null, { timeout: 10_000 }).catch(() => {});
    await page.screenshot({ path: `${OUT}/${s.id}.jpg`, type: "jpeg", quality: 80 });
    console.log(`✓ ${s.id}`);
  } catch (e) {
    failed++;
    console.warn(`✗ ${s.id}: ${e.message.split("\n")[0]}`);
  }
  await context.close();
}

await browser.close();
process.exitCode = failed ? 1 : 0;
