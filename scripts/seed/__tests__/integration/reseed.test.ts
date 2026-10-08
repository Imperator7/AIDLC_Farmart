/** seed and reseed (npm run db:seed) against real SQLite: what goes in, and that it is all or nothing. */
import type { DatabaseSync } from "node:sqlite";
import { afterEach, describe, expect, it } from "vitest";
import { openDb } from "../../../../src/server/db/client";
import { reseed, seed, tableCounts } from "../../seed";

const open: DatabaseSync[] = [];
const empty = () => {
  const db = openDb(":memory:");
  open.push(db);
  return db;
};
afterEach(() => {
  while (open.length) open.pop()!.close();
});

const SEED_COUNTS = { deals: 4, product_details: 16, products: 16, categories: 8, banners: 6, settings: 5 };

describe("seed", () => {
  it("fills an empty database with the data in src/data", () => {
    const db = empty();
    expect(tableCounts(db)).toEqual({ deals: 0, product_details: 0, products: 0, categories: 0, banners: 0, settings: 0 });
    seed(db);
    expect(tableCounts(db)).toEqual(SEED_COUNTS);
  });
});

describe("reseed (npm run db:seed)", () => {
  it("seeds a brand-new database", () => {
    const db = empty();
    reseed(db);
    expect(tableCounts(db)).toEqual(SEED_COUNTS);
  });

  it("throws away local edits and restores exactly the seed data", () => {
    const db = empty();
    seed(db);
    db.exec("UPDATE products SET price_cents = 1 WHERE id = 'bs1'; DELETE FROM banners; INSERT INTO settings (key, value) VALUES ('extra', 'x')");
    reseed(db);
    expect(db.prepare("SELECT price_cents FROM products WHERE id = 'bs1'").get()).toEqual({ price_cents: 195 });
    expect(tableCounts(db)).toEqual(SEED_COUNTS);
  });

  it("is all or nothing: a failure leaves the old data in place", () => {
    const db = empty();
    seed(db);
    db.exec("UPDATE products SET price_cents = 1 WHERE id = 'bs1'");
    // A trigger that makes the seed's first category insert fail.
    db.exec("CREATE TRIGGER no_categories BEFORE INSERT ON categories BEGIN SELECT RAISE(ABORT, 'blocked'); END");
    expect(() => reseed(db)).toThrow(/blocked/);
    expect(db.prepare("SELECT price_cents FROM products WHERE id = 'bs1'").get()).toEqual({ price_cents: 1 });
    expect(tableCounts(db).products).toBe(16);
  });
});
