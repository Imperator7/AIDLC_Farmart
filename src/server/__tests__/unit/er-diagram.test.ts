import { readFileSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";
import { SCHEMA } from "../../db/schema";

/** The ERD at /database-er-diagram is written by hand; this fails when the schema changes and it doesn't. */
const html = readFileSync(path.join(__dirname, "..", "..", "db", "mermaid.html"), "utf8");
const diagram = html.slice(html.indexOf("erDiagram"), html.indexOf("</pre>"));

const db = new DatabaseSync(":memory:");
db.exec(SCHEMA);
const tables = (db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").all() as { name: string }[]).map((t) => t.name);

/** The `table { ... }` block of the diagram. */
const block = (table: string) => diagram.match(new RegExp(`\\n\\s*${table} \\{([^}]*)\\}`))?.[1] ?? "";

describe("database ER diagram", () => {
  it.each(tables)("has every column of %s with its type", (table) => {
    const columns = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string; type: string; pk: number }[];
    const body = block(table);
    expect(body, `missing entity ${table}`).not.toBe("");
    for (const c of columns) expect(body).toMatch(new RegExp(`\\b${c.type} ${c.name}\\b${c.pk ? " PK" : ""}`));
    // No stale columns left in the diagram.
    expect(body.trim().split("\n").length).toBe(columns.length);
  });

  it("draws every foreign key as a relationship", () => {
    for (const table of tables) {
      const fks = db.prepare(`PRAGMA foreign_key_list(${table})`).all() as { table: string; from: string }[];
      for (const fk of fks) {
        expect(diagram).toMatch(new RegExp(`${fk.table} \\|\\|--o[{|] ${table} :`));
        expect(block(table)).toMatch(new RegExp(`${fk.from} (PK, )?FK`));
      }
    }
  });
});
