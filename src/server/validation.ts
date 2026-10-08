import { z } from "zod";

/** Query-string booleans: only "true" and "false" (z.coerce.boolean would read "false" as true). */
const bool = z.enum(["true", "false"]).transform((v) => v === "true");
const slug = z.string().trim().max(64);

export const PRODUCT_SORTS = ["relevance", "price_asc", "price_desc", "rating_desc", "discount_desc", "newest", "bestselling"] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number];

/** GET /api/products and the /search page. */
export const productQuery = z
  .object({
    q: z.string().trim().min(1).max(100).optional(),
    category: slug.optional(),
    brand: z.string().trim().max(64).optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    onSale: bool.optional(),
    minRating: z.coerce.number().int().min(1).max(5).optional(),
    sort: z.enum(PRODUCT_SORTS).default("relevance"),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(24),
  })
  .refine((v) => v.minPrice === undefined || v.maxPrice === undefined || v.minPrice <= v.maxPrice, {
    path: ["maxPrice"],
    message: "maxPrice must be greater than or equal to minPrice.",
  });
export type ProductQuery = z.infer<typeof productQuery>;

const collectionLimit = z.coerce.number().int().min(1).max(24).default(12);

/** /api/products/top-savers and /new-arrivals. */
export const collectionQuery = z.object({ category: slug.optional(), limit: collectionLimit });
export type CollectionQuery = z.infer<typeof collectionQuery>;

/** /api/products/bestsellers. */
export const bestsellerQuery = collectionQuery.extend({ period: z.enum(["week", "month"]).default("week") });
export type BestsellerQuery = z.infer<typeof bestsellerQuery>;

export const featuredCategoryQuery = z.object({ limit: z.coerce.number().int().min(1).max(24).default(8) });

export const bannerQuery = z.object({ placement: z.enum(["hero", "hero-side", "promo", "brand"]).optional() });

export const suggestionQuery = z.object({
  q: z.string().trim().min(1).max(100),
  limit: z.coerce.number().int().min(1).max(10).default(5),
});

/** URLSearchParams or Next's `searchParams` → a plain object; blank values count as absent, repeats keep the first. */
export function queryObject(params: URLSearchParams | Record<string, string | string[] | undefined>) {
  const entries = params instanceof URLSearchParams ? [...params.entries()] : Object.entries(params);
  const out: Record<string, string> = {};
  for (const [key, raw] of entries) {
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (value !== undefined && value.trim() !== "" && !(key in out)) out[key] = value;
  }
  return out;
}

/**
 * For pages, where a bad link should still render: drops the fields that fail and keeps the rest.
 * (The API returns 422 instead.)
 */
export function parseLenient<T extends z.ZodType>(schema: T, input: Record<string, string>): z.infer<T> {
  const values = { ...input };
  for (let i = 0; i < 20; i++) {
    const result = schema.safeParse(values);
    if (result.success) return result.data;
    for (const issue of result.error.issues) delete values[String(issue.path[0])];
  }
  return schema.parse({});
}
