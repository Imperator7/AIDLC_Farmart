import { existsSync } from "node:fs";

/**
 * Runs after the webServer has started (Playwright's order), so it can only explain a missing build; the database
 * is seeded by the webServer command (playwright.config.ts › E2E_DB) and needs no check here.
 */
export default function globalSetup() {
  if (!existsSync(".next/BUILD_ID")) throw new Error("No production build. Run `npm run build` first, then `npm run test:e2e`.");
}
