import { CheckIcon, CloseIcon, MinusIcon } from "@/components/icons";
import type { Counts, CoverageFile, Percent, Suite, TestCase, TestFile, TestReport, TestStatus } from "./types";

/** "16.5 s", "240 ms", "<1 ms" */
export function duration(ms: number) {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)} s`;
  return ms < 1 ? "<1 ms" : `${Math.round(ms)} ms`;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

const count = (tests: TestCase[]): Counts => ({
  total: tests.length,
  passed: tests.filter((t) => t.status === "passed").length,
  failed: tests.filter((t) => t.status === "failed").length,
  skipped: tests.filter((t) => t.status === "skipped").length,
});

const testsOf = (file: TestFile) => file.groups.flatMap((g) => g.tests);

function StatusIcon({ status, size = 14 }: { status: TestStatus; size?: number }) {
  if (status === "passed") return <CheckIcon size={size} className="shrink-0 text-emerald-700" aria-label="Passed" role="img" />;
  if (status === "failed") return <CloseIcon size={size} className="shrink-0 text-red-600" aria-label="Failed" role="img" />;
  return <MinusIcon size={size} className="shrink-0 text-gray-500" aria-label="Skipped" role="img" />;
}

/** Green from 90%, amber from 75%, red below. */
const tone = (pct: number) => (pct >= 90 ? "bg-emerald-600" : pct >= 75 ? "bg-amber-400" : "bg-red-600");

function Bar({ value, label }: { value: Percent; label: string }) {
  return (
    <div className="min-w-24" title={`${value.covered} of ${value.total} ${label} run by a test`}>
      <p className="text-sm font-semibold text-gray-900 tabular-nums">{value.pct}%</p>
      <div className="mt-1 h-1.5 rounded-full bg-gray-200">
        <div className={`h-1.5 rounded-full ${tone(value.pct)}`} style={{ width: `${value.pct}%` }} />
      </div>
    </div>
  );
}

function Summary({ report }: { report: TestReport }) {
  const { counts } = report;
  const ok = counts.failed === 0;
  const ranAt = new Date(report.ranAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
  const tiles = [
    { label: "Passed", value: counts.passed, note: `of ${counts.total} tests` },
    { label: "Failed", value: counts.failed, note: counts.failed ? "see Failures below" : "nothing broke" },
    { label: "Skipped", value: counts.skipped, note: "not run on purpose" },
    ...(report.coverage
      ? [
          { label: "Lines covered", value: `${report.coverage.total.lines.pct}%`, note: "backend code run by tests" },
          { label: "Branches covered", value: `${report.coverage.total.branches.pct}%`, note: "if/else paths taken" },
        ]
      : []),
  ];

  return (
    <section aria-labelledby="summary-title" className="rounded-md bg-white p-6">
      <div className="flex items-center gap-4">
        <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${ok ? "bg-emerald-50" : "bg-red-50"}`}>
          <StatusIcon status={ok ? "passed" : "failed"} size={24} />
        </span>
        <div>
          <h2 id="summary-title" className="text-xl font-bold text-gray-900">
            {ok ? `All ${counts.total} tests passed` : `${counts.failed} of ${counts.total} tests failed`}
          </h2>
          <p className="text-sm text-gray-600">
            Ran {ranAt} · took {duration(report.durationMs)} · {plural(report.suites.reduce((n, s) => n + s.files.length, 0), "file")}
          </p>
        </div>
      </div>
      {/* Flex, not grid: whatever the count, the last row stretches instead of leaving an empty cell. */}
      <dl className="mt-6 flex flex-wrap gap-px overflow-hidden rounded-md border border-gray-200 bg-gray-200">
        {tiles.map((t) => (
          <div key={t.label} className="flex-1 basis-36 bg-white p-4">
            <dt className="text-xs font-semibold text-gray-600">{t.label}</dt>
            <dd className="mt-1 text-2xl font-bold text-gray-900 tabular-nums">{t.value}</dd>
            <dd className="text-xs text-gray-500">{t.note}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function Failures({ suites }: { suites: Suite[] }) {
  const failed = suites.flatMap((s) =>
    s.files.flatMap((f) => [
      ...(f.error ? [{ where: f.path, title: "The file could not run", failure: f.error }] : []),
      ...f.groups.flatMap((g) => g.tests.filter((t) => t.status === "failed").map((t) => ({ where: f.path, title: [g.title, t.title].filter(Boolean).join(" › "), failure: t.failure }))),
    ]),
  );
  if (!failed.length) return null;
  return (
    <section aria-labelledby="failures-title">
      <h2 id="failures-title" className="mb-3 text-lg font-bold text-gray-900">
        Failures
      </h2>
      <ul className="space-y-3">
        {failed.map((f, i) => (
          <li key={i} className="rounded-md border-l-4 border-red-600 bg-white p-4">
            <p className="flex items-center gap-2 font-semibold text-gray-900">
              <StatusIcon status="failed" /> {f.title}
            </p>
            <p className="mt-0.5 text-xs text-gray-500">{f.where}</p>
            {f.failure && <pre className="mt-3 overflow-x-auto rounded-sm bg-gray-50 p-3 text-xs leading-relaxed whitespace-pre-wrap text-gray-800">{f.failure}</pre>}
          </li>
        ))}
      </ul>
    </section>
  );
}

function FileRow({ file }: { file: TestFile }) {
  const tests = testsOf(file);
  const c = count(tests);
  const name = file.path.split("/").pop();
  const dir = file.path.slice(0, -name!.length);
  return (
    <details open={file.status === "failed"} className="group border-b border-gray-100 last:border-0">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 px-4 py-2 hover:bg-gray-50 [&::-webkit-details-marker]:hidden">
        <StatusIcon status={file.status} />
        <span className="min-w-0 flex-1 truncate text-sm">
          <span className="font-semibold text-gray-900">{name}</span> <span className="hidden text-xs text-gray-500 sm:inline">{dir}</span>
        </span>
        <span className="shrink-0 text-xs text-gray-600 tabular-nums">
          {c.failed ? <span className="font-semibold text-red-600">{c.failed} failed · </span> : null}
          {plural(c.total, "test")}
        </span>
        <span className="hidden w-16 shrink-0 text-right text-xs text-gray-500 tabular-nums sm:inline">{duration(file.durationMs)}</span>
        <span aria-hidden className="shrink-0 text-gray-500 transition-transform group-open:rotate-90 motion-reduce:transition-none">
          ›
        </span>
      </summary>
      <div className="space-y-4 bg-gray-50 px-4 py-3 sm:pl-11">
        {file.groups.map((g) => (
          <div key={g.title}>
            {/* Original case: titles are often paths like GET /api/products. */}
            {g.title && <p className="mb-1 text-xs font-semibold text-gray-900">{g.title}</p>}
            <ul>
              {g.tests.map((t, i) => (
                <li key={i} className="flex items-start gap-2 py-1 text-sm text-gray-700">
                  <span className="mt-0.5">
                    <StatusIcon status={t.status} size={13} />
                  </span>
                  <span className="min-w-0 flex-1">{t.title}</span>
                  <span className="shrink-0 text-xs text-gray-500 tabular-nums">{duration(t.durationMs)}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </details>
  );
}

function SuiteSection({ suite }: { suite: Suite }) {
  const c = count(suite.files.flatMap(testsOf));
  const time = suite.files.reduce((n, f) => n + f.durationMs, 0);
  return (
    <section aria-labelledby={`suite-${suite.id}`}>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
        <div>
          <h2 id={`suite-${suite.id}`} className="text-lg font-bold text-gray-900">
            {suite.title}
          </h2>
          <p className="text-sm text-gray-600">{suite.about}</p>
        </div>
        <p className="text-sm text-gray-600 tabular-nums">
          <b className={c.failed ? "text-red-600" : "text-emerald-700"}>
            {c.passed}/{c.total} passed
          </b>{" "}
          · {plural(suite.files.length, "file")} · {duration(time)}
        </p>
      </div>
      <div className="overflow-hidden rounded-md bg-white">
        {suite.files.map((f) => (
          <FileRow key={f.path} file={f} />
        ))}
      </div>
    </section>
  );
}

const fullyCovered = (f: CoverageFile) => f.uncoveredLines.length === 0 && [f.lines, f.branches, f.functions, f.statements].every((p) => p.pct === 100);

function CoverageSection({ coverage }: { coverage: NonNullable<TestReport["coverage"]> }) {
  const short = (p: string) => p.replace(/^src\//, "");
  // Files that need attention first (least covered at the top); fully covered ones fold into one list.
  const gaps = coverage.files.filter((f) => !fullyCovered(f)).sort((a, b) => a.branches.pct + a.lines.pct - (b.branches.pct + b.lines.pct));
  const full = coverage.files.filter(fullyCovered);
  return (
    <section aria-labelledby="coverage-title">
      <h2 id="coverage-title" className="text-lg font-bold text-gray-900">
        Backend coverage
      </h2>
      <p className="mb-3 text-sm text-gray-600">
        How much of each backend file the tests actually ran. Files with code no test runs come first, with the line numbers, so you know where a bug could hide.
      </p>
      <div className="overflow-x-auto rounded-md bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-gray-200 text-xs text-gray-600">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">File</th>
              <th scope="col" className="px-4 py-3 font-semibold">Lines</th>
              <th scope="col" className="px-4 py-3 font-semibold">Branches</th>
              <th scope="col" className="px-4 py-3 font-semibold">Functions</th>
              <th scope="col" className="px-4 py-3 font-semibold">Not run (line numbers)</th>
            </tr>
          </thead>
          <tbody>
            {gaps.map((f: CoverageFile) => (
              <tr key={f.path} className="border-b border-gray-100 last:border-0">
                <td className="px-4 py-2.5 font-mono text-xs text-gray-900">{short(f.path)}</td>
                <td className="px-4 py-2.5"><Bar value={f.lines} label="lines" /></td>
                <td className="px-4 py-2.5"><Bar value={f.branches} label="branches" /></td>
                <td className="px-4 py-2.5"><Bar value={f.functions} label="functions" /></td>
                <td className="px-4 py-2.5 text-xs text-gray-600">{f.uncoveredLines.length ? f.uncoveredLines.join(", ") : "—"}</td>
              </tr>
            ))}
            {full.length > 0 && (
              <tr className="border-b border-gray-100 last:border-0">
                <td colSpan={5} className="px-4 py-1">
                  <details>
                    <summary className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-gray-700">
                      <StatusIcon status="passed" />
                      <span>
                        <b className="text-gray-900">{plural(full.length, "file")}</b> fully covered: every line, branch and function runs in a test
                      </span>
                    </summary>
                    <ul className="grid gap-x-6 gap-y-1 pb-3 pl-6 font-mono text-xs text-gray-700 sm:grid-cols-2">
                      {full.map((f) => (
                        <li key={f.path}>{short(f.path)}</li>
                      ))}
                    </ul>
                  </details>
                </td>
              </tr>
            )}
          </tbody>
          <tfoot className="border-t border-gray-200 bg-gray-50">
            <tr>
              <th scope="row" className="px-4 py-3 text-xs font-semibold text-gray-900">All backend files</th>
              <td className="px-4 py-3"><Bar value={coverage.total.lines} label="lines" /></td>
              <td className="px-4 py-3"><Bar value={coverage.total.branches} label="branches" /></td>
              <td className="px-4 py-3"><Bar value={coverage.total.functions} label="functions" /></td>
              <td className="px-4 py-3 text-xs text-gray-600">{coverage.total.statements.pct}% of statements</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}

/** test-report: the whole page body. Presentational, so Storybook can render it from a fixture. */
export default function ReportView({ report }: { report: TestReport }) {
  return (
    <div className="space-y-10">
      <Summary report={report} />
      <Failures suites={report.suites} />
      {report.suites.map((s) => (
        <SuiteSection key={s.id} suite={s} />
      ))}
      {report.coverage && <CoverageSection coverage={report.coverage} />}
    </div>
  );
}

/** Shown before the first `npm run test:report`. */
export function ReportEmpty() {
  return (
    <div className="rounded-md bg-white px-6 py-14 text-center">
      <h2 className="text-lg font-bold text-gray-900">No test report yet</h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-gray-600">
        Run the tests once to create it, then reload this page:
      </p>
      <pre className="mx-auto mt-4 w-fit rounded-sm bg-gray-100 px-4 py-2 text-sm text-gray-900">npm run test:report</pre>
    </div>
  );
}
