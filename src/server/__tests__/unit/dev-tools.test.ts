/** Developer pages are hidden in production (src/lib/dev-tools.ts, src/proxy.ts). */
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DEV_TOOL_PATHS, devToolsEnabled, isDevToolPath } from "@/lib/dev-tools";
import { config, proxy } from "@/proxy";

describe("isDevToolPath", () => {
  it.each(["/on-boarding", "/design", "/design/colors", "/docs/openapi.json", "/database-er-diagram/mermaid.min.js", "/api/hello"])("%s is a developer page", (p) => {
    expect(isDevToolPath(p)).toBe(true);
  });

  it.each(["/", "/designer", "/search", "/api/products", "/docsx"])("%s is not", (p) => {
    expect(isDevToolPath(p)).toBe(false);
  });
});

describe("devToolsEnabled", () => {
  it("always in development and tests, in production only with FARMART_DEV_TOOLS=1", () => {
    expect(devToolsEnabled({ NODE_ENV: "development" })).toBe(true);
    expect(devToolsEnabled({ NODE_ENV: "test" })).toBe(true);
    expect(devToolsEnabled({ NODE_ENV: "production" })).toBe(false);
    expect(devToolsEnabled({ NODE_ENV: "production", FARMART_DEV_TOOLS: "true" })).toBe(false);
    expect(devToolsEnabled({ NODE_ENV: "production", FARMART_DEV_TOOLS: "1" })).toBe(true);
  });
});

describe("proxy", () => {
  afterEach(() => vi.unstubAllEnvs());
  const run = (p: string) => proxy(new NextRequest(`http://localhost${p}`));

  it("has a matcher for every developer page", () => {
    // Matchers must be literals, so they are a second copy of DEV_TOOL_PATHS.
    expect(config.matcher.map((m) => m.replace("/:path*", "")).sort()).toEqual([...DEV_TOOL_PATHS].sort());
  });

  it("lets everything through outside production", () => {
    expect(run("/test-report").headers.get("x-middleware-next")).toBe("1");
  });

  it("hides pages and /api/hello in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(run("/test-report").headers.get("x-middleware-rewrite")).toBe("http://localhost/_hidden");
    const api = run("/api/hello");
    expect(api.status).toBe(404);
    expect(api.headers.get("Content-Type")).toBe("application/problem+json");
    expect(await api.json()).toMatchObject({ code: "NOT_FOUND", instance: "/api/hello", requestId: api.headers.get("X-Request-Id") });
  });

  it("shows them in production with FARMART_DEV_TOOLS=1", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("FARMART_DEV_TOOLS", "1");
    expect(run("/test-report").headers.get("x-middleware-next")).toBe("1");
  });
});
