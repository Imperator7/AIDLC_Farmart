/** The /on-boarding data: live setup state (load-status.ts) plus the hand-written feature flows (features.ts). */
import type { DatabaseStatus } from "@/server/db/status";

export type { DatabaseStatus };

export type ApiOperation = { method: string; path: string; summary: string; built: boolean };

export type ApiGroup = { tag: string; about: string; operations: ApiOperation[] };

export type TestSummary = { ranAt: string; total: number; passed: number; failed: number; linesPct: number | null };

export type OnboardingStatus = {
  node: { version: string; required: string; ok: boolean };
  database: DatabaseStatus;
  /** Rows each table should have after `npm run db:seed`, counted from src/data. Tables not listed aren't compared. */
  expectedRows: Record<string, number>;
  /** null when `npm run test:report` hasn't run yet. */
  tests: TestSummary | null;
  api: ApiGroup[];
};

/** Where a step runs. Each layer has its own label and position in the flow. */
export type Layer = "browser" | "client" | "page" | "route" | "server" | "database" | "source" | "storage";

export type FlowStep = { layer: Layer; title: string; file?: string; note?: string };

/** Where a feature's data comes from today. */
export type DataSource = "sqlite" | "mock" | "browser";

export type Feature = {
  id: string;
  title: string;
  /** What you open to try it. */
  href: string;
  hrefLabel: string;
  source: DataSource;
  summary: string;
  /** What the browser receives, in the Network panel's words. */
  response: string;
  steps: FlowStep[];
  /** Tests that cover it. */
  tests?: string;
};

export type DevTool = { title: string; href: string; external?: boolean; reads: string; about: string };
