import { listCategories } from "@/server/catalog";
import { api, only } from "@/server/http";

/** GET /api/categories */
export const GET = api(() => Response.json({ data: listCategories() }));
export const { POST, PUT, PATCH, DELETE } = only("GET");
