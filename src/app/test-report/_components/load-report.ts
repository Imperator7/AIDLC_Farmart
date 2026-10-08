import { readFile } from "node:fs/promises";
import path from "node:path";
import type { CoverageFile, Percent, Suite, SuiteId, TestCase, TestFile, TestReport, TestStatus } from "./types";

/** Written by `npm run test:report` (vitest JSON reporter + coverage json/json-summary). */
const REPORTS = path.join(process.cwd(), "reports");

type VitestAssertion = { ancestorTitles: string[]; title: string; status: string; duration?: number | null; failureMessages: string[] };
type VitestFile = { name: string; status: string; startTime: number; endTime: number; message?: string; assertionResults: VitestAssertion[] };
type VitestJson = { startTime: number; testResults: VitestFile[] };

type SummaryEntry = Record<"lines" | "statements" | "functions" | "branches", Percent>;
type FinalEntry = {
  statementMap: Record<string, { start: { line: number } }>;
  s: Record<string, number>;
  branchMap: Record<string, { locations: { start: { line: number } }[] }>;
  b: Record<string, number[]>;
};

const SUITES: Record<SuiteId, { title: string; about: string }> = {
  unit: { title: "Unit tests", about: "Backend pure functions: validation, error handling, search helpers, dates. No database." },
  integration: {
    title: "Integration tests",
    about: "Every API route down to a real SQLite database, the database file itself, and the OpenAPI contract.",
  },
  stories: { title: "Component stories", about: "Every Storybook story rendered in Chromium, with its interaction tests." },
  other: { title: "Other tests", about: "Tests outside the usual folders." },
};

const relative = (file: string) => path.relative(process.cwd(), file).replace(/\\/g, "/");

function suiteOf(file: string): SuiteId {
  if (file.includes("/__tests__/unit/")) return "unit";
  if (file.includes("/__tests__/integration/")) return "integration";
  if (/\.stories\.[jt]sx?$/.test(file)) return "stories";
  return "other";
}

const status = (s: string): TestStatus => (s === "passed" ? "passed" : s === "failed" ? "failed" : "skipped");

/** Vitest failure messages carry ANSI colors and long stacks; keep the readable part. */
const cleanFailure = (messages: string[]) =>
  messages
    .join("\n")
    .replace(/\u001b\[[0-9;]*m/g, "")
    .split("\n")
    .filter((line) => !/^\s+at /.test(line))
    .join("\n")
    .trim();

function toFile(raw: VitestFile): TestFile {
  const groups = new Map<string, TestCase[]>();
  for (const a of raw.assertionResults) {
    const title = a.ancestorTitles.join(" › ");
    const test: TestCase = { title: a.title, status: status(a.status), durationMs: a.duration ?? 0 };
    if (a.failureMessages.length) test.failure = cleanFailure(a.failureMessages);
    groups.set(title, [...(groups.get(title) ?? []), test]);
  }
  const file: TestFile = {
    path: relative(raw.name),
    status: status(raw.status),
    durationMs: Math.max(0, raw.endTime - raw.startTime),
    groups: [...groups].map(([title, tests]) => ({ title, tests })),
  };
  if (raw.message) file.error = cleanFailure([raw.message]);
  return file;
}

function uncovered(entry: FinalEntry | undefined) {
  if (!entry) return [];
  const lines = new Set<number>();
  for (const [id, hits] of Object.entries(entry.s)) if (hits === 0) lines.add(entry.statementMap[id].start.line);
  for (const [id, hits] of Object.entries(entry.b))
    hits.forEach((h, i) => {
      if (h === 0) lines.add(entry.branchMap[id].locations[i]?.start.line ?? entry.branchMap[id].locations[0].start.line);
    });
  return [...lines].sort((a, b) => a - b);
}

async function readJson<T>(file: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(path.join(REPORTS, file), "utf8")) as T;
  } catch {
    return null;
  }
}

/** Reads the latest run, or null when `npm run test:report` hasn't been run yet. */
export async function loadReport(): Promise<TestReport | null> {
  const results = await readJson<VitestJson>("test-results.json");
  if (!results) return null;

  const files = results.testResults.map(toFile).sort((a, b) => a.path.localeCompare(b.path));
  const suites: Suite[] = (Object.keys(SUITES) as SuiteId[])
    .map((id) => ({ id, ...SUITES[id], files: files.filter((f) => suiteOf(f.path) === id) }))
    .filter((s) => s.files.length);

  const tests = files.flatMap((f) => f.groups.flatMap((g) => g.tests));
  const count = (s: TestStatus) => tests.filter((t) => t.status === s).length;
  const end = Math.max(results.startTime, ...results.testResults.map((f) => f.endTime));

  const summary = await readJson<Record<string, SummaryEntry>>("coverage/coverage-summary.json");
  const final = await readJson<Record<string, FinalEntry>>("coverage/coverage-final.json");
  const finalByPath = new Map(Object.entries(final ?? {}).map(([file, entry]) => [relative(file), entry]));

  const pick = (e: SummaryEntry) => ({ lines: e.lines, statements: e.statements, functions: e.functions, branches: e.branches });
  const coverage = summary
    ? {
        total: pick(summary.total),
        files: Object.entries(summary)
          .filter(([file]) => file !== "total")
          .map(([file, entry]): CoverageFile => ({ path: relative(file), ...pick(entry), uncoveredLines: uncovered(finalByPath.get(relative(file))) }))
          .sort((a, b) => a.path.localeCompare(b.path)),
      }
    : null;

  return {
    ranAt: new Date(results.startTime).toISOString(),
    durationMs: end - results.startTime,
    counts: { total: tests.length, passed: count("passed"), failed: count("failed"), skipped: count("skipped") },
    suites,
    coverage,
  };
}
