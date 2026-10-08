/** The /test-report data, already shaped for reading (load-report.ts builds it from vitest's JSON). */

export type TestStatus = "passed" | "failed" | "skipped";

export type TestCase = { title: string; status: TestStatus; durationMs: number; failure?: string };

/** Tests under one `describe` (or the file itself when there is none). */
export type TestGroup = { title: string; tests: TestCase[] };

export type TestFile = {
  /** Repo-relative path, e.g. src/server/__tests__/unit/http.test.ts */
  path: string;
  status: TestStatus;
  durationMs: number;
  groups: TestGroup[];
  /** A file-level error (e.g. it failed to import), separate from test failures. */
  error?: string;
};

export type SuiteId = "unit" | "integration" | "stories" | "other";

export type Suite = { id: SuiteId; title: string; about: string; files: TestFile[] };

export type Counts = { total: number; passed: number; failed: number; skipped: number };

export type Percent = { pct: number; covered: number; total: number };

export type CoverageFile = {
  path: string;
  lines: Percent;
  statements: Percent;
  functions: Percent;
  branches: Percent;
  /** Line numbers with a statement or branch that never ran. */
  uncoveredLines: number[];
};

export type TestReport = {
  ranAt: string;
  durationMs: number;
  counts: Counts;
  suites: Suite[];
  coverage: { total: Omit<CoverageFile, "path" | "uncoveredLines">; files: CoverageFile[] } | null;
};
