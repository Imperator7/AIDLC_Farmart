import { newArrivals } from "@/server/catalog";
import { api, only, parseQuery } from "@/server/http";
import { collectionQuery } from "@/server/validation";

/** GET /api/products/new-arrivals */
export const GET = api((request) => Response.json(newArrivals(parseQuery(request, collectionQuery))));
export const { POST, PUT, PATCH, DELETE } = only("GET");
