import { readFile } from "node:fs/promises";
import path from "node:path";
import { parse } from "yaml";
import { loadReport } from "@/app/test-report/_components/load-report";
import { allProducts, banners, categories, topSaver } from "@/data/home";
import { productDetails } from "@/data/product-details";
import { databaseStatus } from "@/server/db/status";
import type { ApiGroup, OnboardingStatus } from "./types";

const REQUIRED_NODE = "22.13";
const METHODS = ["get", "post", "put", "patch", "delete"] as const;

/** "24.3.0" meets "22.13" */
function meets(version: string, required: string) {
  const [a, b] = version.split(".").map(Number);
  const [x, y] = required.split(".").map(Number);
  return a > x || (a === x && b >= y);
}

type Spec = {
  tags?: { name: string; description?: string }[];
  paths: Record<string, Partial<Record<(typeof METHODS)[number], { summary?: string; tags?: string[] }>>>;
};

/** Every operation in openapi.yaml, grouped by tag in the spec's order; "✓" in a summary means it's built. */
async function loadApi(): Promise<ApiGroup[]> {
  const spec = parse(await readFile(path.join(process.cwd(), "openapi.yaml"), "utf8")) as Spec;
  const groups = new Map<string, ApiGroup>((spec.tags ?? []).map((t) => [t.name, { tag: t.name, about: t.description ?? "", operations: [] }]));
  for (const [apiPath, item] of Object.entries(spec.paths)) {
    for (const method of METHODS) {
      const op = item[method];
      if (!op) continue;
      const tag = op.tags?.[0] ?? "Other";
      if (!groups.has(tag)) groups.set(tag, { tag, about: "", operations: [] });
      const summary = op.summary ?? "";
      groups.get(tag)!.operations.push({ method: method.toUpperCase(), path: apiPath, summary: summary.replace(/\s*✓\s*$/, ""), built: summary.includes("✓") });
    }
  }
  return [...groups.values()].filter((g) => g.operations.length);
}

/** Everything /on-boarding shows, read fresh on each request. Nothing here writes to the database. */
export async function loadOnboarding(): Promise<OnboardingStatus> {
  const [report, api] = await Promise.all([loadReport(), loadApi()]);
  return {
    node: { version: process.versions.node, required: REQUIRED_NODE, ok: meets(process.versions.node, REQUIRED_NODE) },
    database: databaseStatus(),
    expectedRows: {
      categories: categories.length,
      products: allProducts.length,
      product_details: Object.keys(productDetails).length,
      deals: topSaver.length,
      banners: banners.length,
    },
    tests: report
      ? {
          ranAt: report.ranAt,
          total: report.counts.total,
          passed: report.counts.passed,
          failed: report.counts.failed,
          linesPct: report.coverage?.total.lines.pct ?? null,
        }
      : null,
    api,
  };
}
