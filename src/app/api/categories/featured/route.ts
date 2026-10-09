import { featuredCategories } from "@/server/catalog";
import { api, only, parseQuery } from "@/server/http";
import { featuredCategoryQuery } from "@/server/validation";

/** GET /api/categories/featured */
export const GET = api((request) => Response.json({ data: featuredCategories(parseQuery(request, featuredCategoryQuery).limit) }));
export const { POST, PUT, PATCH, DELETE } = only("GET");
