import { readFile } from "node:fs/promises";
import path from "node:path";
import type { E2ECase, E2EImage, E2EImageKind, E2EReport, E2EStatus } from "./types";

/** Written by `npm run test:e2e`: results.json and, under artifacts/, every screenshot. */
export const E2E_DIR = path.join(/* turbopackIgnore: true */ process.cwd(), "reports", "e2e");

/** Where /e2e/shots/[...path] serves the screenshots from. */
export const SHOTS_URL = "/e2e/shots";

type Attachment = { name: string; contentType: string; path?: string };
type Result = { status: string; duration: number; startTime: string; error?: { message?: string }; attachments: Attachment[] };
type PwTest = { projectName: string; status: string; results: Result[] };
/** `id` is unique per test; tests made in a loop share a `line`, so line alone can't identify them. */
type Spec = { id?: string; title: string; file: string; line: number; tests: PwTest[] };
type PwSuite = { title: string; file: string; specs?: Spec[]; suites?: PwSuite[] };
export type PlaywrightJson = { suites: PwSuite[]; stats: { startTime: string; duration: number } };

/** Playwright's messages carry ANSI colours and a stack; keep the readable part. */
const cleanError = (message: string) =>
  message
    .replace(/\u001b\[[0-9;]*m/g, "")
    .split("\n")
    .filter((line) => !/^\s+at /.test(line))
    .join("\n")
    .trim();

/** What an attachment shows, from the names Playwright and e2e/helpers.ts give them; null for non-images. */
export function imageKind(a: Attachment): E2EImageKind | null {
  if (!a.path || !a.contentType.startsWith("image/")) return null;
  if (a.name === "screenshot") return "final";
  if (a.name.startsWith("baseline: ")) return "baseline";
  const visual = /-(expected|actual|diff)\.png$/.exec(a.name);
  return visual ? (visual[1] as E2EImageKind) : "step";
}

/** The URL of a file under `root`, or null when it isn't one (never serve anything outside the report folder). */
export function shotUrl(file: string, root = E2E_DIR): string | null {
  const relative = path.relative(root, path.resolve(root, file));
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) return null;
  return `${SHOTS_URL}/${relative.split(path.sep).map(encodeURIComponent).join("/")}`;
}

/** The file /e2e/shots/<parts> points to: a .png under `root`, or null for anything else (`..`, other types). */
export function shotFile(parts: string[], root = E2E_DIR): string | null {
  if (!parts.length || parts.some((p) => !p || p === "." || p === ".." || /[\\/\0]/.test(p))) return null;
  const file = path.resolve(root, ...parts);
  if (!file.startsWith(root + path.sep) || path.extname(file).toLowerCase() !== ".png") return null;
  return file;
}

function status(test: PwTest): E2EStatus {
  if (test.status === "skipped") return "skipped";
  if (test.status === "flaky") return "flaky";
  return test.status === "expected" ? "passed" : "failed";
}

/** Playwright's JSON → the report the page shows. Failed cases come first in each file. */
export function toReport(json: PlaywrightJson, root = E2E_DIR): E2EReport {
  const cases: E2ECase[] = [];
  const walk = (suite: PwSuite, groups: string[]) => {
    const here = suite.file === suite.title ? groups : [...groups, suite.title];
    for (const spec of suite.specs ?? [])
      for (const test of spec.tests) {
        const last = test.results.at(-1);
        const images = (last?.attachments ?? []).flatMap((a): E2EImage[] => {
          const kind = imageKind(a);
          const src = kind && shotUrl(a.path!, root);
          return kind && src ? [{ name: a.name.replace(/^baseline: /, ""), kind, src }] : [];
        });
        const error = test.results.map((r) => r.error?.message).find(Boolean);
        cases.push({
          id: `${spec.id ?? `${spec.file}:${spec.line}:${spec.title}`}:${test.projectName}`.replace(/[^a-z0-9]+/gi, "-"),
          title: spec.title,
          group: here.join(" › "),
          file: `e2e/${spec.file.replace(/\\/g, "/")}`,
          line: spec.line,
          project: test.projectName,
          status: status(test),
          durationMs: test.results.reduce((n, r) => n + r.duration, 0),
          visual: /^image test/i.test(spec.title) || images.some((i) => i.kind !== "step" && i.kind !== "final"),
          ...(error ? { error: cleanError(error) } : {}),
          images,
        });
      }
    for (const child of suite.suites ?? []) walk(child, here);
  };
  for (const suite of json.suites) walk(suite, []);

  const order = { failed: 0, flaky: 1, passed: 2, skipped: 3 };
  const byFile = new Map<string, E2ECase[]>();
  for (const c of cases) byFile.set(c.file, [...(byFile.get(c.file) ?? []), c]);
  const count = (s: E2EStatus) => cases.filter((c) => c.status === s).length;
  const visual = cases.filter((c) => c.visual);

  return {
    ranAt: json.stats.startTime,
    durationMs: json.stats.duration,
    counts: { total: cases.length, passed: count("passed"), failed: count("failed"), flaky: count("flaky"), skipped: count("skipped") },
    visual: { total: visual.length, failed: visual.filter((c) => c.status === "failed").length },
    files: [...byFile]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([file, list]) => ({ file, cases: list.sort((a, b) => order[a.status] - order[b.status] || a.line - b.line) })),
  };
}

/** Reads the latest run, or null when `npm run test:e2e` hasn't been run yet. */
export async function loadE2E(root = E2E_DIR): Promise<E2EReport | null> {
  try {
    return toReport(JSON.parse(await readFile(path.join(root, "results.json"), "utf8")) as PlaywrightJson, root);
  } catch {
    return null;
  }
}
