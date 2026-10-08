import { existsSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { DEFAULT_DB_FILE, getDb } from "./client";
import { SCHEMA_VERSION } from "./schema";

export type DatabaseState = "missing" | "outdated" | "empty" | "ready";

export type DatabaseStatus = {
  /** Repo-relative path, or `:memory:`. */
  file: string;
  state: DatabaseState;
  schemaVersion: number | null;
  expectedSchemaVersion: number;
  /** Row count per table, in schema order. Empty when the file is missing. */
  tables: { table: string; rows: number }[];
};

/**
 * A read-only look at the database for /on-boarding. Unlike getDb() it never throws for a missing, empty or
 * outdated database, and it never creates, migrates or seeds anything: it reports what is there.
 */
export function databaseStatus(file = process.env.FARMART_DB || DEFAULT_DB_FILE): DatabaseStatus {
  const memory = file === ":memory:";
  const base = { file: memory ? file : path.relative(process.cwd(), file).replace(/\\/g, "/"), expectedSchemaVersion: SCHEMA_VERSION };
  if (!memory && !existsSync(file)) return { ...base, state: "missing", schemaVersion: null, tables: [] };

  const db = memory ? getDb() : new DatabaseSync(file, { readOnly: true });
  try {
    const { user_version: version } = db.prepare("PRAGMA user_version").get() as { user_version: number };
    const names = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY rowid").all() as { name: string }[];
    const tables = names.map(({ name }) => ({ table: name, rows: (db.prepare(`SELECT count(*) AS n FROM "${name}"`).get() as { n: number }).n }));
    const products = tables.find((t) => t.table === "products")?.rows ?? 0;
    const state: DatabaseState = version !== 0 && version !== SCHEMA_VERSION ? "outdated" : products === 0 ? "empty" : "ready";
    return { ...base, state, schemaVersion: version, tables };
  } finally {
    if (!memory) db.close();
  }
}
