import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { SCHEMA, SCHEMA_VERSION } from "./schema";

/** `.data/farmart.sqlite` by default; set FARMART_DB to another file, or `:memory:` for tests. */
// turbopackIgnore: the database is read at runtime, so the build must not trace (and copy) the project folder for it.
export const DEFAULT_DB_FILE = path.join(/* turbopackIgnore: true */ process.cwd(), ".data", "farmart.sqlite");

/** The database can't serve the app yet; the message says which command fixes it. */
export class DatabaseNotReadyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DatabaseNotReadyError";
  }
}

const shown = (file: string) => (file === ":memory:" ? file : path.relative(process.cwd(), file) || file);

/**
 * Opens the database and creates any missing tables. It never adds data: the seed lives outside the backend,
 * in `scripts/seed/seed.ts` (`npm run db:seed`). The schema runs in one write transaction, so parallel build
 * workers opening the same file don't race.
 */
export function openDb(file = process.env.FARMART_DB || DEFAULT_DB_FILE): DatabaseSync {
  if (file !== ":memory:") mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec("PRAGMA busy_timeout = 5000");

  const { user_version: version } = db.prepare("PRAGMA user_version").get() as { user_version: number };
  if (version !== 0 && version !== SCHEMA_VERSION) {
    db.close();
    throw new DatabaseNotReadyError(
      `${shown(file)} was built for schema version ${version}, but the code needs version ${SCHEMA_VERSION}. Stop the dev server and run \`npm run db:reset\`.`,
    );
  }

  db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON");
  db.exec("BEGIN IMMEDIATE");
  try {
    db.exec(SCHEMA);
    db.exec(`PRAGMA user_version = ${SCHEMA_VERSION}`);
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    db.close(); // don't leave the file locked (Windows can't delete or reopen it otherwise)
    throw e;
  }
  return db;
}

/**
 * The file the app actually opens. On Vercel (`VERCEL` is set, at build and at runtime) the deployed files are
 * read-only, and openDb writes (the schema check, WAL mode), so the database bundled with the deployment is copied
 * once per instance into the writable temp folder and opened there. Everywhere else it is `file` itself.
 */
export function servedFile(file: string, env: Record<string, string | undefined> = process.env, dir = tmpdir()): string {
  if (file === ":memory:" || !env.VERCEL) return file;
  const copy = path.join(dir, path.basename(file));
  if (!existsSync(copy)) copyFileSync(file, copy);
  return copy;
}

// One connection per server process; kept on globalThis so dev hot reloads don't open a new one each edit.
const holder = globalThis as unknown as { farmartDb?: DatabaseSync };

/**
 * The app's connection. It fails with a clear message instead of serving an empty store when the database
 * hasn't been seeded, and it never creates the file itself. Nothing is cached on failure, so the next
 * request succeeds once `npm run db:seed` has run; no restart needed.
 */
export function getDb(): DatabaseSync {
  if (holder.farmartDb) return holder.farmartDb;
  const file = process.env.FARMART_DB || DEFAULT_DB_FILE;
  if (file !== ":memory:" && !existsSync(file)) throw new DatabaseNotReadyError(`There is no database at ${shown(file)}. Run \`npm run db:seed\`.`);
  const db = openDb(servedFile(file));
  const { n } = db.prepare("SELECT count(*) AS n FROM products").get() as { n: number };
  if (n === 0) {
    db.close();
    throw new DatabaseNotReadyError(`${shown(file)} has no data. Run \`npm run db:seed\`.`);
  }
  return (holder.farmartDb = db);
}
