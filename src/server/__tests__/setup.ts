import type { DatabaseSync } from "node:sqlite";

// getDb() keeps one connection on globalThis. Workers can reuse globalThis across test files,
// so drop it before each file: every file starts from a freshly seeded in-memory database.
const holder = globalThis as unknown as { farmartDb?: DatabaseSync };
holder.farmartDb?.close();
delete holder.farmartDb;
