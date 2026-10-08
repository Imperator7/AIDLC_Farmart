import { readFile } from "node:fs/promises";
import path from "node:path";
import { parse } from "yaml";

// openapi.yaml only changes with a deploy, so serve it as a static file built at build time.
export const dynamic = "force-static";

/** GET /docs/openapi.json: the API spec (repo-root `openapi.yaml`) as JSON, for Swagger UI and codegen. */
export async function GET() {
  const spec = parse(await readFile(path.join(process.cwd(), "openapi.yaml"), "utf8"));
  return Response.json(spec);
}
