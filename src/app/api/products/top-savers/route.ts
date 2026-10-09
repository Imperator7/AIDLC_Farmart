import { topSavers } from "@/server/catalog";
import { api, only, parseQuery } from "@/server/http";
import { collectionQuery } from "@/server/validation";

/** GET /api/products/top-savers: today's deals and when they end. */
export const GET = api((request) => Response.json(topSavers(parseQuery(request, collectionQuery))));
export const { POST, PUT, PATCH, DELETE } = only("GET");
