/** databaseStatus (the /on-boarding dashboard): reports every database state, read-only, without creating anything. */
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterAll, describe, expect, it } from "vitest";
import { seed } from "../../../../scripts/seed/seed";
import { openDb } from "../../db/client";
import { SCHEMA_VERSION } from "../../db/schema";
import { databaseStatus } from "../../db/status";

const dir = mkdtempSync(path.join(tmpdir(), "farmart-status-"));
const file = (name: string) => path.join(dir, name);
afterAll(() => rmSync(dir, { recursive: true, force: true }));

const SEEDED = [
  { table: "categories", rows: 8 },
  { table: "products", rows: 16 },
  { table: "product_details", rows: 16 },
  { table: "deals", rows: 4 },
  { table: "banners", rows: 6 },
  { table: "settings", rows: 5 },
];

describe("databaseStatus", () => {
  it("reports a missing file and doesn't create it", () => {
    const status = databaseStatus(file("missing.sqlite"));
    expect(status).toMatchObject({ state: "missing", schemaVersion: null, expectedSchemaVersion: SCHEMA_VERSION, tables: [] });
    expect(status.file).toMatch(/missing\.sqlite$/);
    expect(status.file).not.toContain("\\");
    expect(existsSync(file("missing.sqlite"))).toBe(false);
  });

  it("reports tables without data as empty", () => {
    openDb(file("empty.sqlite")).close();
    const status = databaseStatus(file("empty.sqlite"));
    expect(status.state).toBe("empty");
    expect(status.tables.map((t) => t.rows)).toEqual([0, 0, 0, 0, 0, 0]);
  });

  it("reports a file with no tables at all as empty", () => {
    new DatabaseSync(file("blank.sqlite")).close();
    expect(databaseStatus(file("blank.sqlite"))).toMatchObject({ state: "empty", schemaVersion: 0, tables: [] });
  });

  it("reports a seeded database as ready, with rows per table in schema order", () => {
    const db = openDb(file("ready.sqlite"));
    seed(db);
    db.close();
    expect(databaseStatus(file("ready.sqlite"))).toMatchObject({ state: "ready", schemaVersion: SCHEMA_VERSION, tables: SEEDED });
  });

  it("reports another schema version as outdated, and leaves the file as it was", () => {
    const db = openDb(file("old.sqlite"));
    seed(db);
    db.exec("PRAGMA user_version = 99");
    db.close();
    expect(databaseStatus(file("old.sqlite"))).toMatchObject({ state: "outdated", schemaVersion: 99 });
    const raw = new DatabaseSync(file("old.sqlite"), { readOnly: true });
    expect(raw.prepare("PRAGMA user_version").get()).toEqual({ user_version: 99 });
    raw.close();
  });

  it("reads the app's connection for an in-memory database (tests)", () => {
    expect(process.env.FARMART_DB).toBe(":memory:");
    expect(databaseStatus()).toMatchObject({ file: ":memory:", state: "ready", tables: SEEDED });
  });
});
