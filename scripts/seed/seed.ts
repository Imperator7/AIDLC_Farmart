/**
 * The seed: everything that turns src/data into database rows. The backend never imports this file.
 *
 *   src/data/*.ts ──findSeedProblems──▶ seed() / reseed() ──▶ .data/farmart.sqlite ──compareWithSeed()──▶ differences
 *
 * scripts/seed/cli.ts runs it (npm run db:seed | db:check | db:reset).
 */
import type { DatabaseSync } from "node:sqlite";
import { openDb } from "../../src/server/db/client";
import { allProducts, banners, bestSellers, categories, justLanding, slugify, topSaver } from "@/data/home";
import { productDetails } from "@/data/product-details";
import { DELIVERY_FEE, FREE_DELIVERY_FROM } from "@/data/store";

const cents = (dollars: number) => Math.round(dollars * 100);
const DAY = 86_400_000;

type SeedData = {
  categories: { slug: string; name: string }[];
  products: { id: string; name: string; category: string; price: number; oldPrice?: number | null }[];
  detailIds: string[];
  dealIds: string[];
};

/**
 * Checks the mock data before inserting it and explains every problem in plain words, so a bad edit in
 * src/data says "product ts1 is in category X, which isn't in categories" instead of "FOREIGN KEY constraint failed".
 */
export function findSeedProblems({ categories: cats, products, detailIds, dealIds }: SeedData): string[] {
  const problems: string[] = [];
  const where = "src/data/home.ts";
  if (!cats.length) problems.push(`There are no categories (\`categoryList\` in ${where} is empty).`);
  if (!products.length) problems.push(`There are no products (topSaver, bestSellers and justLanding in ${where} are empty).`);

  const slugs = new Set(cats.map((c) => c.slug));
  const ids = new Set<string>();
  for (const p of products) {
    if (ids.has(p.id)) problems.push(`Product id "${p.id}" is used twice in ${where}.`);
    ids.add(p.id);
    if (!slugs.has(slugify(p.category))) problems.push(`Product ${p.id} ("${p.name}") is in category "${p.category}", which isn't in \`categoryList\` in ${where}.`);
    if (!(p.price > 0)) problems.push(`Product ${p.id} has price ${p.price}; it must be above 0.`);
    if (p.oldPrice != null && p.oldPrice <= p.price) problems.push(`Product ${p.id} has oldPrice ${p.oldPrice}, which must be above its price ${p.price} (or leave it out).`);
  }
  for (const id of detailIds) if (!ids.has(id)) problems.push(`src/data/product-details.ts has details for "${id}", which isn't a product.`);
  for (const id of dealIds) if (!ids.has(id)) problems.push(`Top Saver deal "${id}" isn't a product.`);
  return problems;
}

/** Thrown when src/data can't be seeded; the message lists every problem. */
export class SeedDataError extends Error {
  constructor(readonly problems: string[]) {
    super(`The seed data in src/data has ${problems.length} problem${problems.length === 1 ? "" : "s"}:\n${problems.map((p) => `  - ${p}`).join("\n")}`);
    this.name = "SeedDataError";
  }
}

/**
 * Fills an empty database from the mock data in `src/data`, so the API serves exactly what the UI showed before.
 * This is setup tooling, not backend code: the app only reads the database (src/server/db/client.ts never seeds).
 * Sales and dates are made up to keep the home rows as they were: Best Seller items sell the most,
 * Just Landing items are the newest.
 */
export function seed(db: DatabaseSync, now = new Date("2026-10-01T00:00:00Z")) {
  const problems = findSeedProblems({
    categories,
    products: allProducts,
    detailIds: Object.keys(productDetails),
    dealIds: topSaver.map((p) => p.id),
  });
  if (problems.length) throw new SeedDataError(problems);

  const insertCategory = db.prepare("INSERT INTO categories (slug, name, image, position, featured) VALUES (?, ?, ?, ?, 1)");
  categories.forEach((c, i) => insertCategory.run(c.slug, c.name, c.image, i + 1));

  const insertProduct = db.prepare(`
    INSERT INTO products (id, brand, name, category_slug, unit, price_cents, old_price_cents, rating, reviews, image, stock, sold_week, sold_month, created_at)
    VALUES (:id, :brand, :name, :category, :unit, :price, :oldPrice, :rating, :reviews, :image, :stock, :soldWeek, :soldMonth, :createdAt)`);
  const bestIndex = (id: string) => bestSellers.findIndex((p) => p.id === id);
  const newIndex = (id: string) => justLanding.findIndex((p) => p.id === id);

  allProducts.forEach((p, i) => {
    const best = bestIndex(p.id);
    const soldWeek = best >= 0 ? 400 - best * 40 : 20 + ((i * 37) % 60);
    const fresh = newIndex(p.id);
    const createdAt = new Date(now.getTime() - (fresh >= 0 ? fresh : 30 + i) * DAY).toISOString();
    insertProduct.run({
      id: p.id,
      brand: p.brand,
      name: p.name,
      category: slugify(p.category),
      unit: p.unit,
      price: cents(p.price),
      oldPrice: p.oldPrice ? cents(p.oldPrice) : null,
      rating: p.rating,
      reviews: p.reviews,
      image: p.image,
      stock: p.stock ?? 100,
      soldWeek,
      soldMonth: soldWeek * 4 + 15,
      createdAt,
    });
  });

  const insertDetails = db.prepare("INSERT INTO product_details (product_id, description, origin, storage, highlights) VALUES (?, ?, ?, ?, ?)");
  for (const [id, d] of Object.entries(productDetails)) insertDetails.run(id, d.description, d.origin, d.storage, JSON.stringify(d.highlights));

  const insertDeal = db.prepare("INSERT INTO deals (product_id, sold) VALUES (?, ?)");
  for (const p of topSaver) insertDeal.run(p.id, p.sold ?? 0);

  const insertBanner = db.prepare(`
    INSERT INTO banners (id, placement, eyebrow, title, subtitle, brand, image, image_alt, href, cta_label, position)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  banners.forEach((b, i) =>
    insertBanner.run(b.id, b.placement, b.eyebrow ?? null, b.title, b.subtitle ?? null, b.brand ?? null, b.image, b.imageAlt, b.href, b.ctaLabel ?? null, i + 1),
  );

  const insertSetting = db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)");
  for (const [key, value] of Object.entries({
    currency: "USD",
    free_delivery_from_cents: String(cents(FREE_DELIVERY_FROM)),
    delivery_fee_cents: String(cents(DELIVERY_FEE)),
    member_discount_percent: "15",
    time_zone: "Asia/Bangkok",
  }))
    insertSetting.run(key, value);
}

/** Every table, children before parents, so deleting in this order never breaks a foreign key. */
export const TABLES = ["deals", "product_details", "products", "categories", "banners", "settings"] as const;

/**
 * Empties every table and seeds again, in one transaction (all or nothing). Used by `npm run db:seed`
 * to undo local edits without deleting the file, so it works while `npm run dev` is running.
 */
export function reseed(db: DatabaseSync) {
  db.exec("BEGIN IMMEDIATE");
  try {
    for (const table of TABLES) db.exec(`DELETE FROM ${table}`);
    seed(db);
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}

/** Row count per table, for the seed script's summary. */
export function tableCounts(db: DatabaseSync) {
  return Object.fromEntries(TABLES.map((t) => [t, (db.prepare(`SELECT count(*) AS n FROM ${t}`).get() as { n: number }).n]));
}

// db:check

/** The column that identifies a row in each table. */
const KEY: Record<(typeof TABLES)[number], string> = {
  deals: "product_id",
  product_details: "product_id",
  products: "id",
  categories: "slug",
  banners: "id",
  settings: "key",
};

type Row = Record<string, unknown>;

/**
 * Compares a database with a fresh seed of src/data (`npm run db:check`) and describes every difference
 * in plain words, e.g. "products bs1: price_cents is 1, the seed has 195". An empty list means it matches.
 */
export function compareWithSeed(db: DatabaseSync): string[] {
  const reference = openDb(":memory:");
  seed(reference);
  try {
    const differences: string[] = [];
    for (const table of TABLES) {
      const key = KEY[table];
      const rows = (source: DatabaseSync) => new Map((source.prepare(`SELECT * FROM ${table}`).all() as Row[]).map((r) => [String(r[key]), r]));
      const want = rows(reference);
      const have = rows(db);
      for (const [id, expected] of want) {
        const actual = have.get(id);
        if (!actual) {
          differences.push(`${table} ${id}: missing`);
          continue;
        }
        for (const column of Object.keys(expected))
          if (actual[column] !== expected[column])
            differences.push(`${table} ${id}: ${column} is ${JSON.stringify(actual[column])}, the seed has ${JSON.stringify(expected[column])}`);
      }
      for (const id of have.keys()) if (!want.has(id)) differences.push(`${table} ${id}: extra row, not in the seed`);
    }
    return differences;
  } finally {
    reference.close();
  }
}
