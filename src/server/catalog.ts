/**
 * Catalog queries shared by the API route handlers and the server-rendered pages,
 * so `/api/products` and the /search page always agree. Shapes follow openapi.yaml.
 */
import type { SQLInputValue } from "node:sqlite";
import type { Banner, BannerPlacement, Category, Product, SearchSuggestions } from "@/data/home";
import { getDb } from "./db/client";
import { ApiError } from "./http";
import type { BestsellerQuery, CollectionQuery, ProductQuery } from "./validation";

/** openapi.yaml › Product */
export type CatalogProduct = Product & {
  categorySlug: string;
  oldPrice: number | null;
  discountPercent: number;
  stock: number;
  inStock: boolean;
};

export type PageMeta = { page: number; limit: number; total: number; totalPages: number };
export type ProductPage = { data: CatalogProduct[]; meta: PageMeta };

export type StoreSettings = { currency: string; freeDeliveryFrom: number; deliveryFee: number; memberDiscountPercent: number };

type Params = Record<string, SQLInputValue>;

type ProductRow = {
  id: string;
  brand: string;
  name: string;
  category_slug: string;
  category_name: string;
  unit: string;
  price_cents: number;
  old_price_cents: number | null;
  rating: number;
  reviews: number;
  image: string;
  stock: number;
  deal_sold: number | null;
};

const dollars = (cents: number) => cents / 100;

/** Same rule as `discountPercent` in src/data/home.ts. */
const DISCOUNT = "CASE WHEN p.old_price_cents IS NULL THEN 0 ELSE round((1.0 - p.price_cents * 1.0 / p.old_price_cents) * 100) END";

const SELECT_PRODUCT = `
  SELECT p.id, p.brand, p.name, p.category_slug, c.name AS category_name, p.unit, p.price_cents, p.old_price_cents,
         p.rating, p.reviews, p.image, p.stock, d.sold AS deal_sold
  FROM products p
  JOIN categories c ON c.slug = p.category_slug
  LEFT JOIN deals d ON d.product_id = p.id`;

function toProduct(r: ProductRow): CatalogProduct {
  const oldPrice = r.old_price_cents === null ? null : dollars(r.old_price_cents);
  const product: CatalogProduct = {
    id: r.id,
    brand: r.brand,
    name: r.name,
    category: r.category_name,
    categorySlug: r.category_slug,
    unit: r.unit,
    price: dollars(r.price_cents),
    oldPrice,
    discountPercent: oldPrice ? Math.round((1 - r.price_cents / r.old_price_cents!) * 100) : 0,
    rating: r.rating,
    reviews: r.reviews,
    image: r.image,
    stock: r.stock,
    inStock: r.stock - (r.deal_sold ?? 0) > 0,
  };
  if (r.deal_sold !== null) product.sold = r.deal_sold;
  return product;
}

export type CatalogProductDetail = CatalogProduct & { description: string; origin: string; storage: string; highlights: string[] };

type DetailRow = ProductRow & { description: string; origin: string; storage: string; highlights: string };

/** GET /api/products/{id}: the product with its long-form content (openapi.yaml › ProductDetail). */
export function getProduct(id: string): CatalogProductDetail {
  const row = getDb()
    .prepare(
      `SELECT p.id, p.brand, p.name, p.category_slug, c.name AS category_name, p.unit, p.price_cents, p.old_price_cents,
              p.rating, p.reviews, p.image, p.stock, d.sold AS deal_sold,
              coalesce(pd.description, '') AS description, coalesce(pd.origin, '') AS origin,
              coalesce(pd.storage, '') AS storage, coalesce(pd.highlights, '[]') AS highlights
       FROM products p
       JOIN categories c ON c.slug = p.category_slug
       LEFT JOIN deals d ON d.product_id = p.id
       LEFT JOIN product_details pd ON pd.product_id = p.id
       WHERE p.id = ?`,
    )
    .get(id) as DetailRow | undefined;
  if (!row) throw new ApiError(404, "PRODUCT_NOT_FOUND", "Product not found", `No product with id "${id}".`);
  return { ...toProduct(row), description: row.description, origin: row.origin, storage: row.storage, highlights: JSON.parse(row.highlights) as string[] };
}

/** Escapes LIKE wildcards so "50%" searches for a literal percent sign. */
const likeEscape = (s: string) => s.toLowerCase().replace(/[\\%_]/g, (m) => `\\${m}`);

const ORDER_BY: Record<Exclude<ProductQuery["sort"], "relevance">, string> = {
  price_asc: "p.price_cents ASC",
  price_desc: "p.price_cents DESC",
  rating_desc: "p.rating DESC, p.reviews DESC",
  discount_desc: `${DISCOUNT} DESC`,
  newest: "p.created_at DESC",
  bestselling: "p.sold_week DESC",
};

/** GET /api/products: every word of `q` must appear in the name, brand or category (AND). */
export function listProducts(query: ProductQuery): ProductPage {
  const where: string[] = [];
  const params: Params = {};

  const terms = query.q?.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 5) ?? [];
  terms.forEach((term, i) => {
    params[`t${i}`] = `%${likeEscape(term)}%`;
    where.push(`(lower(p.name) LIKE :t${i} ESCAPE '\\' OR lower(p.brand) LIKE :t${i} ESCAPE '\\' OR lower(c.name) LIKE :t${i} ESCAPE '\\')`);
  });
  if (query.category) {
    where.push("p.category_slug = :category");
    params.category = query.category;
  }
  if (query.brand) {
    where.push("lower(p.brand) = lower(:brand)");
    params.brand = query.brand;
  }
  if (query.minPrice !== undefined) {
    where.push("p.price_cents >= :minPrice");
    params.minPrice = Math.round(query.minPrice * 100);
  }
  if (query.maxPrice !== undefined) {
    where.push("p.price_cents <= :maxPrice");
    params.maxPrice = Math.round(query.maxPrice * 100);
  }
  if (query.onSale !== undefined) where.push(query.onSale ? "p.old_price_cents IS NOT NULL" : "p.old_price_cents IS NULL");
  if (query.minRating !== undefined) {
    where.push("p.rating >= :minRating");
    params.minRating = query.minRating;
  }

  let order: string;
  if (query.sort !== "relevance") order = ORDER_BY[query.sort];
  else if (terms.length) {
    // Name starts with the first word, then a word in the name does, then anywhere in the name, then brand/category only.
    params.prefix = `${likeEscape(terms[0])}%`;
    params.word = `% ${likeEscape(terms[0])}%`;
    order = `CASE
      WHEN lower(p.name) LIKE :prefix ESCAPE '\\' OR lower(p.name) LIKE :word ESCAPE '\\' THEN 0
      WHEN lower(p.name) LIKE :t0 ESCAPE '\\' THEN 1
      ELSE 2 END, p.sold_week DESC`;
  } else order = ORDER_BY.bestselling;

  const db = getDb();
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const { total } = db
    .prepare(`SELECT count(*) AS total FROM products p JOIN categories c ON c.slug = p.category_slug ${whereSql}`)
    .get(stripUnused(params, whereSql)) as { total: number };

  const rows = db
    .prepare(`${SELECT_PRODUCT} ${whereSql} ORDER BY ${order}, p.id LIMIT :limit OFFSET :offset`)
    .all({ ...params, limit: query.limit, offset: (query.page - 1) * query.limit }) as ProductRow[];

  return {
    data: rows.map(toProduct),
    meta: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) },
  };
}

/** node:sqlite rejects named parameters the statement doesn't use. */
function stripUnused(params: Params, sql: string): Params {
  return Object.fromEntries(Object.entries(params).filter(([k]) => sql.includes(`:${k}`)));
}

function collection(order: string, { category, limit }: CollectionQuery, extraWhere = "") {
  const where = [extraWhere, category ? "p.category_slug = :category" : ""].filter(Boolean);
  const sql = `${SELECT_PRODUCT} ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY ${order}, p.id LIMIT :limit`;
  const params: Params = { limit };
  if (category) params.category = category;
  return (getDb().prepare(sql).all(params) as ProductRow[]).map(toProduct);
}

/** GET /api/products/top-savers: today's deals, biggest saving first. */
export function topSavers(query: CollectionQuery) {
  return { data: collection(`${DISCOUNT} DESC`, query, "d.product_id IS NOT NULL"), endsAt: dealEndsAt() };
}

/** GET /api/products/bestsellers */
export function bestsellers(query: BestsellerQuery) {
  return { data: collection(query.period === "month" ? "p.sold_month DESC" : "p.sold_week DESC", query) };
}

/** GET /api/products/new-arrivals */
export function newArrivals(query: CollectionQuery) {
  return { data: collection("p.created_at DESC", query) };
}

const SELECT_CATEGORY = `
  SELECT c.slug, c.name, c.image, (SELECT count(*) FROM products p WHERE p.category_slug = c.slug) AS productCount
  FROM categories c`;

/** GET /api/categories */
export function listCategories(): Category[] {
  return getDb().prepare(`${SELECT_CATEGORY} ORDER BY c.position`).all() as Category[];
}

/** GET /api/categories/featured */
export function featuredCategories(limit = 8): Category[] {
  return getDb().prepare(`${SELECT_CATEGORY} WHERE c.featured = 1 ORDER BY c.position LIMIT ?`).all(limit) as Category[];
}

type BannerRow = {
  id: string;
  placement: BannerPlacement;
  eyebrow: string | null;
  title: string;
  subtitle: string | null;
  brand: string | null;
  image: string;
  image_alt: string;
  href: string;
  cta_label: string | null;
  position: number;
  starts_at: string | null;
  ends_at: string | null;
};

/** GET /api/banners: only banners inside their schedule window. */
export function listBanners(placement?: BannerPlacement, now = new Date()) {
  const rows = getDb()
    .prepare(
      `SELECT * FROM banners
       WHERE (:placement IS NULL OR placement = :placement)
         AND (starts_at IS NULL OR starts_at <= :now) AND (ends_at IS NULL OR ends_at > :now)
       ORDER BY position`,
    )
    .all({ placement: placement ?? null, now: now.toISOString() }) as BannerRow[];
  return rows.map(
    (r): Banner & { position: number; startsAt: string | null; endsAt: string | null } => ({
      id: r.id,
      placement: r.placement,
      eyebrow: r.eyebrow,
      title: r.title,
      subtitle: r.subtitle,
      brand: r.brand,
      image: r.image,
      imageAlt: r.image_alt,
      href: r.href,
      ctaLabel: r.cta_label,
      position: r.position,
      startsAt: r.starts_at,
      endsAt: r.ends_at,
    }),
  );
}

function settings(): Record<string, string> {
  const rows = getDb().prepare("SELECT key, value FROM settings").all() as { key: string; value: string }[];
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

/** GET /api/store/settings */
export function getStoreSettings(): StoreSettings {
  const s = settings();
  return {
    currency: s.currency ?? "USD",
    freeDeliveryFrom: dollars(Number(s.free_delivery_from_cents ?? 0)),
    deliveryFee: dollars(Number(s.delivery_fee_cents ?? 0)),
    memberDiscountPercent: Number(s.member_discount_percent ?? 0),
  };
}

/** The next midnight in the store's time zone, when today's Top Saver deals end. */
export function dealEndsAt(now = new Date(), timeZone = settings().time_zone ?? "UTC") {
  const part = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })
      .formatToParts(now)
      .map((p) => [p.type, Number(p.value)]),
  );
  // Wall-clock time in the zone, read as if it were UTC, minus the real instant = the zone's offset.
  const offset = Date.UTC(part.year, part.month - 1, part.day, part.hour, part.minute, part.second) - Math.floor(now.getTime() / 1000) * 1000;
  return new Date(Date.UTC(part.year, part.month - 1, part.day + 1) - offset).toISOString();
}

/** GET /api/search/suggestions: the best product matches plus categories whose name matches. */
export function searchSuggestions(q: string, limit = 5): SearchSuggestions {
  const products = listProducts({ q, sort: "relevance", page: 1, limit }).data.map(({ id, name, image, price }) => ({ id, name, image, price }));
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 5);
  const categories = getDb()
    .prepare(`SELECT slug, name FROM categories WHERE ${terms.map((_, i) => `lower(name) LIKE :t${i} ESCAPE '\\'`).join(" AND ")} ORDER BY position LIMIT 3`)
    .all(Object.fromEntries(terms.map((t, i) => [`t${i}`, `%${likeEscape(t)}%`]))) as { slug: string; name: string }[];
  return { query: q, products, categories };
}
