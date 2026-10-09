import Image from "next/image";
import { CheckIcon, CloseIcon, MinusIcon } from "@/components/icons";
import type { E2ECase, E2EImage, E2EImageKind, E2EReport, E2EStatus } from "./types";

/** "16.5 s", "240 ms" */
const duration = (ms: number) => (ms >= 1000 ? `${(ms / 1000).toFixed(1)} s` : `${Math.round(ms)} ms`);
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

const STATUS_LABEL: Record<E2EStatus, string> = { passed: "Passed", failed: "Failed", flaky: "Passed on retry", skipped: "Skipped" };

function StatusIcon({ status, size = 14 }: { status: E2EStatus; size?: number }) {
  const label = STATUS_LABEL[status];
  if (status === "passed") return <CheckIcon size={size} className="shrink-0 text-emerald-700" aria-label={label} role="img" />;
  if (status === "failed") return <CloseIcon size={size} className="shrink-0 text-red-600" aria-label={label} role="img" />;
  if (status === "flaky") return <CheckIcon size={size} className="shrink-0 text-amber-700" aria-label={label} role="img" />;
  return <MinusIcon size={size} className="shrink-0 text-gray-500" aria-label={label} role="img" />;
}

const KIND_LABEL: Record<E2EImageKind, string> = {
  step: "Step",
  final: "Final state",
  baseline: "Approved baseline",
  expected: "Expected (baseline)",
  actual: "Actual (this run)",
  diff: "Difference",
};

/** A screenshot thumbnail that opens the full-size image in a new tab. */
function Shot({ image, wide = false }: { image: E2EImage; wide?: boolean }) {
  const caption = image.kind === "step" ? image.name : KIND_LABEL[image.kind];
  const ring = image.kind === "diff" ? "border-red-600" : image.kind === "baseline" ? "border-emerald-600" : "border-gray-200";
  return (
    <figure className={wide ? "min-w-0" : "w-40 shrink-0 sm:w-48"}>
      <a href={image.src} target="_blank" rel="noreferrer" className={`relative block aspect-[4/3] overflow-hidden rounded-sm border bg-gray-50 ${ring}`}>
        {/* Screenshots from the last run are local files that change every run: no optimizer, no cache. */}
        <Image src={image.src} alt={`${caption} screenshot`} fill unoptimized sizes="200px" className="object-cover object-top" />
      </a>
      <figcaption className="mt-1 truncate text-xs text-gray-600" title={caption}>
        {caption}
      </figcaption>
    </figure>
  );
}

function CaseCard({ c }: { c: E2ECase }) {
  const compare = c.images.filter((i) => i.kind === "expected" || i.kind === "actual" || i.kind === "diff");
  const strip = c.images.filter((i) => !compare.includes(i));
  const accent = c.status === "failed" ? "border-l-red-600" : c.status === "flaky" ? "border-l-amber-400" : "border-l-transparent";
  return (
    <li id={c.id} className={`rounded-md border-l-4 bg-white p-4 ${accent}`}>
      <div className="flex flex-wrap items-start gap-x-3 gap-y-1">
        <span className="mt-0.5">
          <StatusIcon status={c.status} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold break-words text-gray-900">{c.title}</p>
          <p className="text-xs text-gray-500">
            {c.group ? `${c.group} · ` : ""}
            {c.file}:{c.line}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2 text-xs text-gray-600">
          {c.visual && <span className="rounded-sm bg-amber-50 px-1.5 py-0.5 font-semibold text-amber-700">Image test</span>}
          <span className="rounded-sm bg-gray-100 px-1.5 py-0.5">{c.project}</span>
          <span className="tabular-nums">{duration(c.durationMs)}</span>
        </div>
      </div>

      {c.error && <pre className="mt-3 overflow-x-auto rounded-sm bg-gray-50 p-3 text-xs leading-relaxed whitespace-pre-wrap text-gray-800">{c.error}</pre>}

      {compare.length > 0 && (
        <div className="mt-3 grid gap-3 sm:grid-cols-3" aria-label="Image comparison">
          {compare.map((i) => (
            <Shot key={i.kind} image={i} wide />
          ))}
        </div>
      )}

      {strip.length > 0 && (
        <div className="-mx-4 mt-3 flex gap-3 overflow-x-auto px-4 pb-1" aria-label="Screenshots">
          {/* Position, not src: two attachments can point at the same file. */}
          {strip.map((i, n) => (
            <Shot key={`${n}-${i.kind}`} image={i} />
          ))}
        </div>
      )}
    </li>
  );
}

function Summary({ report }: { report: E2EReport }) {
  const { counts, visual } = report;
  const ok = counts.failed === 0;
  const ranAt = new Date(report.ranAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
  const tiles = [
    { label: "Passed", value: counts.passed + counts.flaky, note: counts.flaky ? `${counts.flaky} only on a retry` : `of ${counts.total} tests` },
    { label: "Failed", value: counts.failed, note: counts.failed ? "listed first below" : "nothing broke" },
    { label: "Image tests", value: `${visual.total - visual.failed}/${visual.total}`, note: "match their baselines" },
    { label: "Skipped", value: counts.skipped, note: "not run on purpose" },
  ];
  return (
    <section aria-labelledby="e2e-summary-title" className="rounded-md bg-white p-6">
      <div className="flex items-center gap-4">
        <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${ok ? "bg-emerald-50" : "bg-red-50"}`}>
          <StatusIcon status={ok ? "passed" : "failed"} size={24} />
        </span>
        <div>
          <h2 id="e2e-summary-title" className="text-xl font-bold text-gray-900">
            {ok ? `All ${counts.total} end-to-end tests passed` : `${counts.failed} of ${counts.total} end-to-end tests failed`}
          </h2>
          <p className="text-sm text-gray-600">
            Ran {ranAt} · took {duration(report.durationMs)} · {plural(report.files.length, "file")} · production build, Chromium
          </p>
        </div>
      </div>
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

/** e2e-report: the whole /e2e page body. Presentational, so Storybook can render it from a fixture. */
export default function E2EView({ report }: { report: E2EReport }) {
  return (
    <div className="space-y-10">
      <Summary report={report} />
      {report.files.map(({ file, cases }) => {
        const failed = cases.filter((c) => c.status === "failed").length;
        return (
          <section key={file} aria-labelledby={`file-${file}`}>
            <div className="mb-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
              <h2 id={`file-${file}`} className="font-mono text-base font-bold text-gray-900">
                {file}
              </h2>
              <p className="text-sm text-gray-600 tabular-nums">
                <b className={failed ? "text-red-600" : "text-emerald-700"}>
                  {cases.length - failed}/{cases.length} passed
                </b>
              </p>
            </div>
            <ul className="space-y-3">
              {cases.map((c) => (
                <CaseCard key={c.id} c={c} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

/** Shown before the first `npm run test:e2e`. */
export function E2EEmpty() {
  return (
    <div className="rounded-md bg-white px-6 py-14 text-center">
      <h2 className="text-lg font-bold text-gray-900">No end-to-end report yet</h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-gray-600">Build the app and run the tests once, then reload this page:</p>
      <pre className="mx-auto mt-4 w-fit rounded-sm bg-gray-100 px-4 py-2 text-left text-sm text-gray-900">
        npm run build{"\n"}npm run test:e2e
      </pre>
    </div>
  );
}
