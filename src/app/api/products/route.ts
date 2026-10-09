import { listProducts } from "@/server/catalog";
import { api, only, parseQuery } from "@/server/http";
import { productQuery } from "@/server/validation";

/** GET /api/products: search, filter, sort and page through products. */
export const GET = api((request) => Response.json(listProducts(parseQuery(request, productQuery))));
export const { POST, PUT, PATCH, DELETE } = only("GET");
