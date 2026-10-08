/** compareWithSeed (npm run db:check): a seeded database matches; every kind of drift is named. */
import { describe, expect, it } from "vitest";
import { openDb } from "../../../../src/server/db/client";
import { compareWithSeed, seed } from "../../seed";

const seeded = () => {
  const db = openDb(":memory:");
  seed(db);
  return db;
};

describe("compareWithSeed", () => {
  it("finds nothing in a freshly seeded database", () => {
    const db = seeded();
    expect(compareWithSeed(db)).toEqual([]);
    db.close();
  });

  it("names changed values, missing rows and extra rows in every table it touches", () => {
    const db = seeded();
    db.exec(`
      UPDATE products SET price_cents = 1, stock = 0 WHERE id = 'bs1';
      UPDATE categories SET name = 'Fruit' WHERE slug = 'fruits-vegetables';
      DELETE FROM deals WHERE product_id = 'ts3';
      DELETE FROM banners WHERE id = 'bnr_soda';
      INSERT INTO settings (key, value) VALUES ('extra', 'x');
      UPDATE settings SET value = '0' WHERE key = 'delivery_fee_cents';
    `);
    expect(compareWithSeed(db)).toEqual([
      "deals ts3: missing",
      "products bs1: price_cents is 1, the seed has 195",
      "products bs1: stock is 0, the seed has 100",
      'categories fruits-vegetables: name is "Fruit", the seed has "Fruits & Vegetables"',
      "banners bnr_soda: missing",
      'settings delivery_fee_cents: value is "0", the seed has "499"',
      "settings extra: extra row, not in the seed",
    ]);
    db.close();
  });
});
