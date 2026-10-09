import { readFile } from "node:fs/promises";
import { shotFile } from "../../_components/load-e2e";

// The files change with every `npm run test:e2e`, so read them on each request.
export const dynamic = "force-dynamic";

/** GET /e2e/shots/<path>: one screenshot from reports/e2e (PNG only; nothing outside that folder). */
export async function GET(_request: Request, ctx: RouteContext<"/e2e/shots/[...path]">) {
  const file = shotFile((await ctx.params).path);
  if (!file) return new Response("Not found", { status: 404 });
  try {
    return new Response(new Uint8Array(await readFile(file)), { headers: { "Content-Type": "image/png", "Cache-Control": "no-store" } });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
