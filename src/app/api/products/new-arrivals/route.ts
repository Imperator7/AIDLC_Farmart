import { newArrivals } from "@/server/catalog";
import { api, parseQuery } from "@/server/http";
import { collectionQuery } from "@/server/validation";

/** GET /api/products/new-arrivals */
export const GET = api((request) => Response.json(newArrivals(parseQuery(request, collectionQuery))));
