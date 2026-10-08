/** The backend's database connection: creating tables (never data), refusing unseeded or outdated databases, and the constraints in schema.ts. Uses real files in a temp dir. */
import { mkdtempSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import { seed } from "../../../../scripts/seed/seed";
import { DatabaseNotReadyError, getDb, openDb } from "../../db/client";
import { SCHEMA_VERSION } from "../../db/schema";

const dir = mkdtempSync(path.join(tmpdir(), "farmart-db-"));
const open: DatabaseSync[] = [];
const file = (name: string) => path.join(dir, "nested", name);
const track = (db: DatabaseSync) => (open.push(db), db);
const count = (db: DatabaseSync, table: string) => (db.prepare(`SELECT count(*) AS n FROM ${table}`).get() as { n: number }).n;

afterEach(() => {
  while (open.length) open.pop()!.close();
});
afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe("openDb", () => {
  it("creates the folder, the file and the tables, but no data", () => {
    const db = track(openDb(file("fresh.sqlite")));
    expect(existsSync(file("fresh.sqlite"))).toBe(true);
    for (const table of ["categories", "products", "product_details", "deals", "banners", "settings"]) expect(count(db, table)).toBe(0);
    expect(db.prepare("PRAGMA user_version").get()).toEqual({ user_version: SCHEMA_VERSION });
    expect(db.prepare("PRAGMA journal_mode").get()).toEqual({ journal_mode: "wal" });
    expect(db.prepare("PRAGMA foreign_keys").get()).toEqual({ foreign_keys: 1 });
  });

  it("keeps data across reopens", () => {
    const first = track(openDb(file("reopen.sqlite")));
    seed(first);
    first.prepare("UPDATE products SET stock = 7 WHERE id = 'bs1'").run();
    first.close();
    open.pop();
    const again = track(openDb(file("reopen.sqlite")));
    expect(count(again, "products")).toBe(16);
    expect(again.prepare("SELECT stock FROM products WHERE id = 'bs1'").get()).toEqual({ stock: 7 });
  });

  it("lets two connections open the same file (as parallel build workers do)", () => {
    const a = track(openDb(file("shared.sqlite")));
    seed(a);
    const b = track(openDb(file("shared.sqlite")));
    expect(count(b, "products")).toBe(16);
  });

  it("refuses a database from another schema version, and leaves it alone", () => {
    const old = track(openDb(file("old.sqlite")));
    seed(old);
    old.exec("PRAGMA user_version = 99");
    old.close();
    open.pop();
    expect(() => openDb(file("old.sqlite"))).toThrow(DatabaseNotReadyError);
    expect(() => openDb(file("old.sqlite"))).toThrow(/schema version 99.*needs version 1.*npm run db:reset/);
    const check = track(new DatabaseSync(file("old.sqlite")));
    expect(count(check, "products")).toBe(16);
  });

  it("rolls back and fails loudly when the schema can't be created", () => {
    // A leftover table from an unknown schema (user_version 0): CREATE IF NOT EXISTS keeps it, its indexes can't be built.
    const broken = new DatabaseSync(file("broken.sqlite"));
    broken.exec("CREATE TABLE products (id TEXT PRIMARY KEY)");
    broken.close();
    expect(() => openDb(file("broken.sqlite"))).toThrow(/no such column/);
    const check = track(new DatabaseSync(file("broken.sqlite")));
    // The schema runs in one transaction, so the file is left exactly as it was: only the old table.
    const tables = check.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all() as { name: string }[];
    expect(tables.map((t) => t.name)).toEqual(["products"]);
  });

  it("opens an in-memory database without touching the disk", () => {
    expect(count(track(openDb(":memory:")), "products")).toBe(0);
  });

  it("uses FARMART_DB when no file is given", () => {
    expect(process.env.FARMART_DB).toBe(":memory:");
    expect(count(track(openDb()), "products")).toBe(0);
  });
});

describe("getDb", () => {
  // setup-db.ts gives this file a seeded connection; these tests swap it out and put it back.
  const holder = globalThis as unknown as { farmartDb?: DatabaseSync };
  const seeded = holder.farmartDb;
  const withoutConnection = (fn: () => void) => {
    delete holder.farmartDb;
    try {
      fn();
    } finally {
      holder.farmartDb = seeded;
      vi.unstubAllEnvs();
    }
  };

  it("reuses one connection per process", () => {
    expect(getDb()).toBe(getDb());
  });

  it("never creates a missing database; it says to run db:seed", () => {
    withoutConnection(() => {
      vi.stubEnv("FARMART_DB", file("missing.sqlite"));
      expect(() => getDb()).toThrow(DatabaseNotReadyError);
      expect(() => getDb()).toThrow(/There is no database at .*missing\.sqlite\. Run `npm run db:seed`/);
      expect(existsSync(file("missing.sqlite"))).toBe(false);
    });
  });

  it("refuses an empty database, then works once it is seeded (no restart)", () => {
    withoutConnection(() => {
      track(openDb(file("empty.sqlite")));
      vi.stubEnv("FARMART_DB", file("empty.sqlite"));
      expect(() => getDb()).toThrow(/has no data\. Run `npm run db:seed`/);
      expect(holder.farmartDb).toBeUndefined();
      seed(open[open.length - 1]);
      const db = track(getDb());
      expect(count(db, "products")).toBe(16);
    });
  });

  it("also refuses an empty in-memory database", () => {
    withoutConnection(() => {
      expect(() => getDb()).toThrow(/:memory: has no data/);
    });
  });
});

describe("schema constraints", () => {
  const db = () => {
    const d = track(openDb(":memory:"));
    seed(d);
    return d;
  };
  const insertProduct = (d: DatabaseSync, overrides: Record<string, unknown>) =>
    d
      .prepare(
        `INSERT INTO products (id, brand, name, category_slug, unit, price_cents, old_price_cents, rating, reviews, image, stock, created_at)
         VALUES (:id, 'b', 'n', :category, 'u', :price, :oldPrice, :rating, 0, 'x', :stock, '2026-01-01')`,
      )
      .run({ id: "new", category: "pet-foods", price: 100, oldPrice: null, rating: 4, stock: 1, ...overrides } as never);

  it("accepts a valid product", () => {
    expect(() => insertProduct(db(), {})).not.toThrow();
  });

  it.each([
    ["an unknown category (foreign key)", { category: "nope" }, /FOREIGN KEY/],
    ["a zero price", { price: 0 }, /CHECK/],
    ["an old price not above the price", { oldPrice: 100 }, /CHECK/],
    ["a rating above 5", { rating: 6 }, /CHECK/],
    ["negative stock", { stock: -1 }, /CHECK/],
    ["a duplicate id", { id: "ts1" }, /UNIQUE|PRIMARY/],
  ])("rejects %s", (_name, overrides, error) => {
    expect(() => insertProduct(db(), overrides)).toThrow(error);
  });

  it("rejects an unknown banner placement and a negative deal count", () => {
    const d = db();
    expect(() => d.prepare("INSERT INTO banners (id, placement, title, image, image_alt, href, position) VALUES ('b', 'footer', 't', 'x', 'x', '/', 1)").run()).toThrow(/CHECK/);
    expect(() => d.prepare("UPDATE deals SET sold = -1 WHERE product_id = 'ts1'").run()).toThrow(/CHECK/);
  });

  it("keeps category names unique", () => {
    expect(() => db().prepare("INSERT INTO categories (slug, name, image, position) VALUES ('x', 'Pet Foods', 'x', 9)").run()).toThrow(/UNIQUE/);
  });

  it("deletes a product's details and deal with it (cascade)", () => {
    const d = db();
    d.prepare("DELETE FROM products WHERE id = 'ts4'").run();
    expect(d.prepare("SELECT count(*) AS n FROM product_details WHERE product_id = 'ts4'").get()).toEqual({ n: 0 });
    expect(d.prepare("SELECT count(*) AS n FROM deals WHERE product_id = 'ts4'").get()).toEqual({ n: 0 });
  });

  it("won't delete a category that still has products", () => {
    expect(() => db().prepare("DELETE FROM categories WHERE slug = 'pet-foods'").run()).toThrow(/FOREIGN KEY/);
  });
});
