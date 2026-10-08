import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import ReportView, { ReportEmpty } from "./report-view";
import type { TestReport } from "./types";

const pct = (covered: number, total: number) => ({ covered, total, pct: Math.round((covered / total) * 10000) / 100 });

const passing: TestReport = {
  ranAt: "2026-10-07T12:44:00.000Z",
  durationMs: 14_600,
  counts: { total: 6, passed: 6, failed: 0, skipped: 0 },
  suites: [
    {
      id: "unit",
      title: "Unit tests",
      about: "Backend pure functions: validation, error handling, search helpers, dates. No database.",
      files: [
        {
          path: "src/server/__tests__/unit/http.test.ts",
          status: "passed",
          durationMs: 58,
          groups: [
            { title: "problemResponse", tests: [{ title: "writes an RFC 9457 problem with a stable code", status: "passed", durationMs: 4 }] },
            { title: "api() wrapper", tests: [{ title: "adds X-Request-Id", status: "passed", durationMs: 0.4 }] },
          ],
        },
      ],
    },
    {
      id: "integration",
      title: "Integration tests",
      about: "Every API route down to a real SQLite database, the database file itself, and the OpenAPI contract.",
      files: [
        {
          path: "src/server/__tests__/integration/routes.test.ts",
          status: "passed",
          durationMs: 253,
          groups: [
            {
              title: "GET /api/products",
              tests: [
                { title: "searches and pages", status: "passed", durationMs: 39 },
                { title: "returns 422 for a reversed price range", status: "passed", durationMs: 0.5 },
              ],
            },
            { title: "GET /api/search/suggestions", tests: [{ title: "requires q", status: "passed", durationMs: 1 }, { title: "skipped example", status: "skipped", durationMs: 0 }] },
          ],
        },
      ],
    },
  ],
  coverage: {
    total: { lines: pct(197, 197), statements: pct(241, 241), functions: pct(72, 72), branches: pct(117, 119) },
    files: [
      { path: "src/server/db/client.ts", lines: pct(23, 23), statements: pct(26, 26), functions: pct(2, 2), branches: pct(11, 12), uncoveredLines: [15] },
      { path: "src/server/catalog.ts", lines: pct(90, 90), statements: pct(100, 100), functions: pct(20, 20), branches: pct(40, 40), uncoveredLines: [] },
      { path: "src/server/http.ts", lines: pct(30, 30), statements: pct(32, 32), functions: pct(6, 6), branches: pct(10, 10), uncoveredLines: [] },
    ],
  },
};

const failing: TestReport = {
  ...passing,
  counts: { total: 6, passed: 4, failed: 2, skipped: 0 },
  suites: passing.suites.map((s) =>
    s.id !== "integration"
      ? s
      : {
          ...s,
          files: s.files.map((f) => ({
            ...f,
            status: "failed" as const,
            groups: f.groups.map((g, i) =>
              i
                ? g
                : {
                    ...g,
                    tests: [
                      {
                        title: "searches and pages",
                        status: "failed" as const,
                        durationMs: 41,
                        failure: "AssertionError: expected 2 to be 1\n\n- Expected\n+ Received\n\n- 1\n+ 2",
                      },
                      { title: "returns 422 for a reversed price range", status: "failed" as const, durationMs: 1, failure: "AssertionError: expected 200 to be 422" },
                    ],
                  },
            ),
          })),
        },
  ),
};

/** Tools/Test report: the /test-report page body, from a fixture (the page reads reports/ written by npm run test:report). */
const meta = {
  title: "Tools/Test report",
  component: ReportView,
  args: { report: passing },
  globals: { backgrounds: { value: "soft" } },
} satisfies Meta<typeof ReportView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllPassed: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("heading", { name: "All 6 tests passed" })).toBeVisible();
    await expect(canvas.getByText("2 files")).toBeVisible(); // the two fully covered files fold into one line
  },
};

/** Failures are listed first with their messages, and failed files open on their own. */
export const WithFailures: Story = {
  args: { report: failing },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("heading", { name: "2 of 6 tests failed" })).toBeVisible();
    await expect(canvas.getByRole("heading", { name: "Failures" })).toBeVisible();
    await expect(canvas.getAllByText(/expected 200 to be 422/)[0]).toBeVisible();
  },
};

export const NoReportYet: Story = { render: () => <ReportEmpty /> };
