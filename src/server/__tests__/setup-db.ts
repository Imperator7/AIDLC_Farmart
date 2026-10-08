import type { DatabaseSync } from "node:sqlite";
import { seed } from "../../../scripts/seed/seed";
import { openDb } from "../db/client";

// The backend never seeds (getDb refuses an empty database), so integration tests do what `npm run db:seed`
// does for a real setup: every test file gets its own in-memory database with the seed data, used by getDb().
const holder = globalThis as unknown as { farmartDb?: DatabaseSync };
const db = openDb(":memory:");
seed(db);
holder.farmartDb = db;
