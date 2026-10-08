import { getProduct } from "@/server/catalog";
import { api } from "@/server/http";

/** GET /api/products/{id}: one product with its long-form content. */
export const GET = api(async (_request, ctx: RouteContext<"/api/products/[id]">) => Response.json(getProduct((await ctx.params).id)));
