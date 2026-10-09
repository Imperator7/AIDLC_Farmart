/**
 * The developer pages: they show the schema, the source layout, test results and coverage, which a public store
 * shouldn't publish. `src/proxy.ts` hides them in production unless FARMART_DEV_TOOLS=1.
 */
export const DEV_TOOL_PATHS = ["/on-boarding", "/test-report", "/e2e", "/overview", "/design", "/docs", "/database-er-diagram", "/api/hello"];

/** Whether `pathname` is a developer page (or below one, like `/design/colors` or `/docs/openapi.json`). */
export const isDevToolPath = (pathname: string) => DEV_TOOL_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

/** Whether developer pages are served: always in development, in production only with FARMART_DEV_TOOLS=1. */
export const devToolsEnabled = (env: { NODE_ENV?: string; FARMART_DEV_TOOLS?: string }) =>
  env.NODE_ENV !== "production" || env.FARMART_DEV_TOOLS === "1";
