import { listCategories } from "@/server/catalog";
import { api } from "@/server/http";

/** GET /api/categories */
export const GET = api(() => Response.json({ data: listCategories() }));
