/** The /e2e data, already shaped for reading (load-e2e.ts builds it from Playwright's JSON report). */

/** `flaky` passed only on a retry. */
export type E2EStatus = "passed" | "failed" | "flaky" | "skipped";

/**
 * One image of a test case:
 * - `step`: a named screenshot the test took along the way (e2e/helpers.ts › snap);
 * - `final`: the page when the test ended;
 * - `baseline`: the approved image an image test compared against (it passed);
 * - `expected` / `actual` / `diff`: an image test that failed, side by side.
 */
export type E2EImageKind = "step" | "final" | "baseline" | "expected" | "actual" | "diff";

export type E2EImage = { name: string; kind: E2EImageKind; src: string };

export type E2ECase = {
  /** Stable within one run, for anchors. */
  id: string;
  title: string;
  /** The `describe` titles, joined with " › ". */
  group: string;
  /** Repo-relative, e.g. e2e/cart.spec.ts */
  file: string;
  line: number;
  /** The Playwright project: desktop or mobile. */
  project: string;
  status: E2EStatus;
  durationMs: number;
  /** An image test (toHaveScreenshot) rather than a behaviour test. */
  visual: boolean;
  error?: string;
  images: E2EImage[];
};

export type E2ECounts = { total: number; passed: number; failed: number; flaky: number; skipped: number };

export type E2EReport = {
  ranAt: string;
  durationMs: number;
  counts: E2ECounts;
  /** How many of the cases are image tests, and how many of those failed. */
  visual: { total: number; failed: number };
  files: { file: string; cases: E2ECase[] }[];
};
