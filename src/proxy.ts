import { type NextRequest, NextResponse } from "next/server";
import { devToolsEnabled, isDevToolPath } from "@/lib/dev-tools";

/**
 * Hides the developer pages in production (see src/lib/dev-tools.ts): they answer 404 as if they didn't exist.
 * Set FARMART_DEV_TOOLS=1 on the server to show them, for example on a private preview deploy.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!isDevToolPath(pathname) || devToolsEnabled(process.env)) return NextResponse.next();
  if (pathname.startsWith("/api/")) {
    // The same NOT_FOUND problem as any unknown /api path (src/app/api/[...path]).
    const requestId = `req_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
    return NextResponse.json(
      { type: "https://farmart.dev/problems/not-found", title: "Not found", status: 404, code: "NOT_FOUND", detail: `No endpoint ${request.method} ${pathname}.`, instance: pathname, requestId },
      { status: 404, headers: { "Content-Type": "application/problem+json", "X-Request-Id": requestId } },
    );
  }
  // A path no page has: Next renders the normal 404 page with status 404.
  return NextResponse.rewrite(new URL("/_hidden", request.url));
}

// Matchers must be literal (Next reads them at build time); keep them in step with DEV_TOOL_PATHS.
export const config = {
  matcher: ["/on-boarding/:path*", "/test-report/:path*", "/e2e/:path*", "/overview/:path*", "/design/:path*", "/docs/:path*", "/database-er-diagram/:path*", "/api/hello"],
};
