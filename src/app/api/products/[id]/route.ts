import { getProduct } from "@/server/catalog";
import { api, only, parsePath } from "@/server/http";
import { productId } from "@/server/validation";

/** GET /api/products/{id}: one product with its long-form content. */
export const GET = api(async (_request, ctx: RouteContext<"/api/products/[id]">) =>
  Response.json(getProduct(parsePath((await ctx.params).id, productId, "id"))),
);
export const { POST, PUT, PATCH, DELETE } = only("GET");
