import { existsSync } from "node:fs";

/** Fails fast, with the fix, when what `next start` needs is missing (instead of a 60 s server timeout). */
export default function globalSetup() {
  if (!existsSync(".next/BUILD_ID")) throw new Error("No production build. Run `npm run build` first, then `npm run test:e2e`.");
  if (!existsSync(process.env.FARMART_DB || ".data/farmart.sqlite")) throw new Error("No database. Run `npm run db:seed` first.");
}
