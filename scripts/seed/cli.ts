/**
 * The seed commands. The logic is in ./seed.ts; this file only reads flags and prints results.
 *
 *   npm run db:seed              empty every table and seed again (safe while `npm run dev` runs)
 *   npm run db:reset             delete the database file and build it from scratch (stop `npm run dev` first)
 *   npm run db:check             compare the database with the seed data, read-only (lists every difference)
 *   npm run db:seed -- --file x  use another file (or set FARMART_DB)
 *
 * The seed is outside the backend: the app only reads the database, and until this has run it fails
 * with "Run `npm run db:seed`".
 *
 * Runs with tsx so the `@/` imports and TypeScript work without a build step.
 */
import { existsSync, rmSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { DatabaseNotReadyError, DEFAULT_DB_FILE, openDb } from "../../src/server/db/client";
import { compareWithSeed, reseed, seed, SeedDataError, tableCounts } from "./seed";

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const option = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};

if (flag("help")) {
  console.log(`Usage: npm run db:seed [-- --reset | --check] [-- --file <path>]

  (default)      Empty every table and seed again from src/data.
  --reset        Delete the database file first and rebuild schema + data.
  --check        Compare the database with the seed data without changing it.
  --file <path>  Database file (default: FARMART_DB or .data/farmart.sqlite).`);
  process.exit(0);
}

const file = path.resolve(option("file") ?? process.env.FARMART_DB ?? DEFAULT_DB_FILE);
const shown = path.relative(process.cwd(), file) || file;

if (flag("check")) {
  // Read-only: compare the database with a fresh seed of src/data and list every difference.
  if (!existsSync(file)) {
    console.error(`${shown} doesn't exist yet. Run \`npm run db:seed\` first.`);
    process.exit(1);
  }
  const db = new DatabaseSync(file, { readOnly: true });
  let differences: string[];
  try {
    differences = compareWithSeed(db);
  } catch (e) {
    if (e instanceof SeedDataError) {
      console.error(`${e.message}\n\nFix src/data first; there is nothing valid to compare against.`);
      process.exit(1);
    }
    console.error(`${shown} can't be read as a Farmart database (${(e as Error).message}). Run \`npm run db:reset\`.`);
    process.exit(1);
  } finally {
    db.close();
  }
  if (!differences.length) {
    const reference = openDb(":memory:");
    seed(reference);
    console.log(`✓ ${shown} matches the seed data in src/data (${Object.entries(tableCounts(reference)).map(([t, n]) => `${n} ${t}`).join(", ")}).`);
    process.exit(0);
  }
  console.error(`✗ ${shown} differs from the seed data in ${differences.length} place${differences.length === 1 ? "" : "s"}:`);
  for (const d of differences.slice(0, 30)) console.error(`  - ${d}`);
  if (differences.length > 30) console.error(`  … and ${differences.length - 30} more`);
  console.error("\nRun `npm run db:seed` to restore the seed data (this discards local changes).");
  process.exit(1);
}

if (flag("reset")) {
  try {
    for (const suffix of ["", "-wal", "-shm"]) rmSync(file + suffix, { force: true });
    console.log(`Deleted ${shown}`);
  } catch (e) {
    const busy = (e as NodeJS.ErrnoException).code === "EBUSY" || (e as NodeJS.ErrnoException).code === "EPERM";
    console.error(busy ? `${shown} is in use. Stop \`npm run dev\` (and Storybook/tests), then run this again.` : e);
    process.exit(1);
  }
}

const created = !existsSync(file);
const started = performance.now();
let counts: Record<string, number>;
try {
  // openDb only creates the tables; reseed empties them and inserts src/data in one transaction.
  const db = openDb(file);
  try {
    reseed(db);
    counts = tableCounts(db);
  } finally {
    db.close();
  }
} catch (e) {
  // Bad seed data: print just the list of problems, not a stack trace. Nothing was written.
  if (e instanceof SeedDataError) {
    console.error(`${e.message}\n\nNothing was changed in ${shown}. Fix the file(s) above and run this again.`);
    process.exit(1);
  }
  // A database from an older schema: the message says to run `npm run db:reset`.
  if (e instanceof DatabaseNotReadyError) {
    console.error(e.message);
    process.exit(1);
  }
  throw e;
}

console.log(`${created ? "Created and seeded" : "Re-seeded"} ${shown} in ${Math.round(performance.now() - started)} ms`);
console.table(counts);
console.log("The home page picks this up within 60 s (it is cached); /search and /api/* show it right away.");
