import { readFile } from "node:fs/promises";
import path from "node:path";

// The diagram only changes with the schema, so it's built once at build time.
export const dynamic = "force-static";

/** GET /database-er-diagram: the Mermaid ERD of the SQLite schema (src/server/db/mermaid.html). */
export async function GET() {
  const html = await readFile(path.join(process.cwd(), "src", "server", "db", "mermaid.html"), "utf8");
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
