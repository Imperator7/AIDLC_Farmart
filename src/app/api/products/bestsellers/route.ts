import { bestsellers } from "@/server/catalog";
import { api, only, parseQuery } from "@/server/http";
import { bestsellerQuery } from "@/server/validation";

/** GET /api/products/bestsellers */
export const GET = api((request) => Response.json(bestsellers(parseQuery(request, bestsellerQuery))));
export const { POST, PUT, PATCH, DELETE } = only("GET");
