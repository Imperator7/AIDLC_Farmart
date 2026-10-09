/** The /e2e report: reading Playwright's JSON, and serving only screenshots from reports/e2e. */
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { imageKind, loadE2E, type PlaywrightJson, shotFile, shotUrl, toReport } from "@/app/e2e/_components/load-e2e";

const root = path.resolve("/tmp/e2e-root");
const at = (...parts: string[]) => path.join(root, ...parts);
const png = (name: string, file: string) => ({ name, contentType: "image/png", path: at("artifacts", file) });

const json: PlaywrightJson = {
  stats: { startTime: "2026-10-10T09:15:00.000Z", duration: 21_400 },
  suites: [
    {
      title: "cart.spec.ts",
      file: "cart.spec.ts",
      suites: [
        {
          title: "Cart",
          file: "cart.spec.ts",
          specs: [
            {
              title: "adds a product",
              file: "cart.spec.ts",
              line: 5,
              tests: [
                {
                  projectName: "desktop",
                  status: "expected",
                  results: [
                    {
                      status: "passed",
                      duration: 900,
                      startTime: "",
                      attachments: [
                        png("toast after add", "a/01-toast.png"),
                        png("screenshot", "a/test-finished-1.png"),
                        { name: "trace", contentType: "application/zip", path: at("artifacts", "a/trace.zip") },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              title: "image test: drawer",
              file: "cart.spec.ts",
              line: 30,
              tests: [
                {
                  projectName: "desktop",
                  status: "unexpected",
                  results: [
                    {
                      status: "failed",
                      duration: 1200,
                      startTime: "",
                      error: { message: "\u001b[31mError: Screenshot comparison failed\u001b[39m\n    at cart.spec.ts:31" },
                      attachments: [png("cart-drawer-expected.png", "b/e.png"), png("cart-drawer-actual.png", "b/a.png"), png("cart-drawer-diff.png", "b/d.png")],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      title: "home.spec.ts",
      file: "home.spec.ts",
      specs: [
        {
          title: "image test: home",
          file: "home.spec.ts",
          line: 9,
          tests: [
            { projectName: "mobile", status: "flaky", results: [{ status: "failed", duration: 100, startTime: "", attachments: [] }, { status: "passed", duration: 200, startTime: "", attachments: [png("baseline: home.png", "c/baseline-home.png")] }] },
            { projectName: "desktop", status: "skipped", results: [] },
          ],
        },
      ],
    },
  ],
};

describe("toReport", () => {
  const report = toReport(json, root);

  it("counts every status, and the image tests apart", () => {
    expect(report.counts).toEqual({ total: 4, passed: 1, failed: 1, flaky: 1, skipped: 1 });
    expect(report.visual).toEqual({ total: 3, failed: 1 });
    expect(report.ranAt).toBe("2026-10-10T09:15:00.000Z");
  });

  it("groups by file and lists failures first", () => {
    expect(report.files.map((f) => f.file)).toEqual(["e2e/cart.spec.ts", "e2e/home.spec.ts"]);
    expect(report.files[0].cases.map((c) => c.title)).toEqual(["image test: drawer", "adds a product"]);
    expect(report.files[0].cases[0]).toMatchObject({ group: "Cart", line: 30, project: "desktop", status: "failed", visual: true });
  });

  it("keeps screenshots in order with their kind, and drops other attachments", () => {
    const adds = report.files[0].cases[1];
    expect(adds.images).toEqual([
      { name: "toast after add", kind: "step", src: "/e2e/shots/artifacts/a/01-toast.png" },
      { name: "screenshot", kind: "final", src: "/e2e/shots/artifacts/a/test-finished-1.png" },
    ]);
    expect(adds.visual).toBe(false);
    expect(report.files[0].cases[0].images.map((i) => i.kind)).toEqual(["expected", "actual", "diff"]);
  });

  it("gives tests made in a loop (same line) different ids", () => {
    const loop = (id: string, title: string) => ({ id, title, file: "r.spec.ts", line: 11, tests: [{ projectName: "mobile", status: "expected", results: [] }] });
    const ids = toReport({ stats: json.stats, suites: [{ title: "r.spec.ts", file: "r.spec.ts", specs: [loop("a1", "home"), loop("b2", "search")] }] }, root).files[0].cases.map((c) => c.id);
    expect(new Set(ids).size).toBe(2);
    // Without Playwright's id, the title still tells them apart.
    const fallback = toReport({ stats: json.stats, suites: [{ title: "r.spec.ts", file: "r.spec.ts", specs: [{ ...loop("", "home"), id: undefined }, { ...loop("", "search"), id: undefined }] }] }, root);
    expect(new Set(fallback.files[0].cases.map((c) => c.id)).size).toBe(2);
  });

  it("strips colours and stack lines from errors", () => {
    expect(report.files[0].cases[0].error).toBe("Error: Screenshot comparison failed");
  });

  it("reads the last retry's images and adds up every try's time", () => {
    const flaky = report.files[1].cases.find((c) => c.status === "flaky")!;
    expect(flaky.images).toEqual([{ name: "home.png", kind: "baseline", src: "/e2e/shots/artifacts/c/baseline-home.png" }]);
    expect(flaky.durationMs).toBe(300);
    expect(flaky.group).toBe("");
  });
});

describe("imageKind", () => {
  it("is null for anything that isn't an image file", () => {
    expect(imageKind({ name: "trace", contentType: "application/zip", path: "x.zip" })).toBeNull();
    expect(imageKind({ name: "step", contentType: "image/png" })).toBeNull();
  });
});

describe("shotUrl and shotFile (path safety)", () => {
  it("turns a file under the root into a URL, encoding each part", () => {
    expect(shotUrl(at("artifacts", "a b", "x.png"), root)).toBe("/e2e/shots/artifacts/a%20b/x.png");
  });

  it("refuses files outside the root", () => {
    expect(shotUrl(path.resolve(root, "..", "secret.png"), root)).toBeNull();
    expect(shotUrl(root, root)).toBeNull();
  });

  it("maps URL parts back to a .png under the root", () => {
    expect(shotFile(["artifacts", "a", "x.png"], root)).toBe(at("artifacts", "a", "x.png"));
  });

  it.each([
    [["..", "package.json"]],
    [["artifacts", "..", "..", "x.png"]],
    [["a\\..\\..\\x.png"]],
    [["a/../../x.png"]],
    [["results.json"]],
    [["x.png\0.txt"]],
    [[]],
    [[""]],
  ])("refuses %j", (parts) => {
    expect(shotFile(parts, root)).toBeNull();
  });
});

describe("loadE2E", () => {
  it("is null before the first run, and reads results.json after", async () => {
    const dir = mkdtempSync(path.join(tmpdir(), "farmart-e2e-"));
    expect(await loadE2E(dir)).toBeNull();
    writeFileSync(path.join(dir, "results.json"), JSON.stringify({ stats: json.stats, suites: [] }));
    expect(await loadE2E(dir)).toMatchObject({ counts: { total: 0 }, files: [] });
  });
});
