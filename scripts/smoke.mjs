// Production smoke test: starts `next start` twice (database seeded, database missing), requests every route,
// and fails on an unexpected status or on server internals reaching the browser.
// Needs `npm run build` first. Usage: npm run smoke  (options: --port 3001, --only healthy|missing)
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const args = process.argv.slice(2);
const option = (name, fallback) => (args.includes(`--${name}`) ? args[args.indexOf(`--${name}`) + 1] : fallback);
const PORT = Number(option("port", "3001"));
const ONLY = option("only", "");
const BASE = `http://localhost:${PORT}`;

/**
 * Every route and the status it should answer in each mode. `db: true` routes read SQLite on each request, so
 * they fail (500) without a database; static pages were rendered at build time and keep working.
 * `internals: true` pages are dev tools that name files and functions on purpose (skipped by the leak check).
 * Dev tools are hidden in production (src/proxy.ts): the healthy run is a plain production server, so they answer
 * 404; the missing run sets FARMART_DEV_TOOLS=1, so they answer 200 there.
 */
const routes = [
  { path: "/", name: "Home (static, ISR)", healthy: 200, missing: 200 },
  { path: "/products/bs5", name: "Product page (static)", healthy: 200, missing: 200 },
  { path: "/products/unknown", name: "Unknown product", healthy: 404, missing: 404 },
  { path: "/search?q=oat", name: "Search", healthy: 200, missing: 500 },
  { path: "/search?category=coffees-teas", name: "Empty category", healthy: 200, missing: 500 },
  { path: "/api/hello", name: "API hello (dev tool)", healthy: 404, missing: 200 },
  { path: "/api/products?q=oat", name: "API products", healthy: 200, missing: 500 },
  { path: "/api/products?limit=0", name: "API bad input", healthy: 422, missing: 422 },
  { path: "/api/products?q=%00", name: "API control characters", healthy: 422, missing: 422 },
  { path: "/api/products", method: "POST", name: "API unsupported method", healthy: 405, missing: 405 },
  { path: "/api/products/bs5", name: "API product detail", healthy: 200, missing: 500 },
  { path: "/api/products/nope", name: "API unknown product", healthy: 404, missing: 500 },
  { path: `/api/products/${"x".repeat(65)}`, name: "API id too long", healthy: 422, missing: 422 },
  { path: "/api/search/suggestions?q=oat", name: "API suggestions", healthy: 200, missing: 500 },
  { path: "/api/store/settings", name: "API settings", healthy: 200, missing: 500 },
  { path: "/api/nope", name: "API unknown path", healthy: 404, missing: 404 },
  { path: "/on-boarding", name: "On-boarding", healthy: 404, missing: 200, internals: true },
  { path: "/test-report", name: "Test report", healthy: 404, missing: 200, internals: true },
  { path: "/e2e", name: "E2E report", healthy: 404, missing: 200, internals: true },
  { path: "/e2e/shots/..%2Fresults.json", name: "E2E shots outside the folder", healthy: 404, missing: 404 },
  { path: "/docs", name: "API docs", healthy: 404, missing: 200 },
  { path: "/docs/openapi.json", name: "OpenAPI JSON", healthy: 404, missing: 200 },
  { path: "/database-er-diagram", name: "ER diagram", healthy: 404, missing: 200 },
  { path: "/design", name: "Design system", healthy: 404, missing: 200 },
  { path: "/overview", name: "UI overview", healthy: 404, missing: 200 },
];

/** Words that mean an error message or source code reached the browser. */
const LEAKS = ["DatabaseNotReadyError", "There is no database", "has no data", "client.ts", "getDb(", "at Object.", "node_modules"];

if (!existsSync(".next/BUILD_ID")) {
  console.error("No production build. Run `npm run build` first.");
  process.exit(1);
}

/** Starts `next start`, resolves once it answers, and returns a stop() that kills the whole process tree. */
async function startServer(env) {
  // Next's own binary through node: no shell, so nothing to escape and one process tree to stop.
  const child = spawn(process.execPath, [path.join("node_modules", "next", "dist", "bin", "next"), "start", "-p", String(PORT)], {
    env: { ...process.env, ...env },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let log = "";
  child.stdout.on("data", (d) => (log += d));
  child.stderr.on("data", (d) => (log += d));
  const stop = () => {
    // On Windows, killing npx leaves `next start` running; taskkill /T takes the whole tree down.
    if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
    else child.kill("SIGTERM");
  };
  for (let i = 0; i < 60; i++) {
    if (child.exitCode !== null) throw new Error(`next start exited early:\n${log}`);
    try {
      await fetch(`${BASE}/api/hello`);
      return { stop, log: () => log };
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  stop();
  throw new Error(`next start didn't answer on port ${PORT} within 60 s (is the port in use?)\n${log}`);
}

async function check(mode) {
  const rows = [];
  for (const r of routes) {
    const res = await fetch(BASE + r.path, { method: r.method ?? "GET", redirect: "manual" });
    const body = await res.text();
    const type = res.headers.get("content-type") ?? "";
    const expected = r[mode];
    const leaks = r.internals ? [] : LEAKS.filter((w) => body.includes(w));
    let gets = type.includes("problem+json") ? `Problem ${JSON.parse(body).code}` : type.includes("json") ? "JSON" : res.status >= 500 ? "error page" : "page";
    if (type.includes("problem+json") && !res.headers.get("x-request-id")) gets += " (no X-Request-Id!)";
    const ok = res.status === expected && !leaks.length && !gets.includes("!");
    rows.push({ route: `${r.method ? `${r.method} ` : ""}${r.path.length > 40 ? `${r.path.slice(0, 37)}…` : r.path}`, what: r.name, expected, status: res.status, gets, leaks: leaks.join(", ") || "-", result: ok ? "ok" : "FAIL" });
  }
  return rows;
}

const modes = [
  { id: "healthy", title: "Database seeded", env: {} },
  {
    id: "missing",
    title: "Database missing, dev tools on",
    env: { FARMART_DB: path.join(mkdtempSync(path.join(tmpdir(), "farmart-smoke-")), "missing.sqlite"), FARMART_DEV_TOOLS: "1" },
  },
].filter((m) => !ONLY || m.id === ONLY);

if (modes.some((m) => m.id === "healthy") && !existsSync(process.env.FARMART_DB || ".data/farmart.sqlite")) {
  console.error("The healthy run needs a seeded database. Run `npm run db:seed` first.");
  process.exit(1);
}

const answers = () => fetch(`${BASE}/api/hello`).then(
  () => true,
  () => false,
);

// Something already on the port would be tested instead of this build (an old server, another app).
if (await answers()) {
  console.error(`Port ${PORT} is already in use. Stop whatever runs there, or pass --port <other>.`);
  process.exit(1);
}

let failures = 0;
for (const mode of modes) {
  const server = await startServer(mode.env);
  try {
    const rows = await check(mode.id);
    console.log(`\n${mode.title} (${mode.id})`);
    console.table(rows);
    const failed = rows.filter((r) => r.result === "FAIL");
    failures += failed.length;
    // In the missing run the real errors must be in the server log, matched by digest or request id.
    if (mode.id === "missing" && !server.log().includes("DatabaseNotReadyError")) {
      console.log("FAIL: the server log doesn't name the error, so it couldn't be traced.");
      failures++;
    }
  } finally {
    server.stop();
    if (mode.env.FARMART_DB) rmSync(path.dirname(mode.env.FARMART_DB), { recursive: true, force: true });
  }
}

// Port check: a leftover server would answer the next run with an old build.
await new Promise((r) => setTimeout(r, 1000));
if (await answers()) {
  console.log(`FAIL: something still answers on port ${PORT} after the run.`);
  failures++;
}

console.log(failures ? `\n✗ ${failures} problem${failures === 1 ? "" : "s"}.` : `\n✓ Smoke test passed: ${modes.map((m) => m.id).join(" + ")}, ${routes.length} routes each, nothing leaked, port ${PORT} closed.`);
process.exit(failures ? 1 : 0);
