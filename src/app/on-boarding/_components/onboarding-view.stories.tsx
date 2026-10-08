import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { commands, devTools, features } from "./features";
import OnboardingView from "./onboarding-view";
import type { OnboardingStatus } from "./types";

const SEEDED = [
  { table: "categories", rows: 8 },
  { table: "products", rows: 16 },
  { table: "product_details", rows: 16 },
  { table: "deals", rows: 4 },
  { table: "banners", rows: 6 },
  { table: "settings", rows: 5 },
];

const ready: OnboardingStatus = {
  node: { version: "24.3.0", required: "22.13", ok: true },
  database: { file: ".data/farmart.sqlite", state: "ready", schemaVersion: 1, expectedSchemaVersion: 1, tables: SEEDED },
  expectedRows: { categories: 8, products: 16, product_details: 16, deals: 4, banners: 6 },
  tests: { ranAt: "2026-10-08T15:27:00.000Z", total: 248, passed: 248, failed: 0, linesPct: 100 },
  api: [
    {
      tag: "Catalog",
      about: "Products, categories and home-page collections",
      operations: [
        { method: "GET", path: "/api/products", summary: "Search, filter and sort products", built: true },
        { method: "GET", path: "/api/products/{id}", summary: "One product with details", built: false },
      ],
    },
    { tag: "Search", about: "Header search autocomplete", operations: [{ method: "GET", path: "/api/search/suggestions", summary: "Suggestions", built: true }] },
    { tag: "Orders", about: "Checkout and order history", operations: [{ method: "POST", path: "/api/orders", summary: "Place an order", built: false }] },
  ],
};

const meta = {
  title: "Tools/On-boarding",
  component: OnboardingView,
  parameters: { layout: "fullscreen" },
  args: { status: ready, features, devTools, commands },
  decorators: [
    (Story) => (
      <div className="bg-gray-100 p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof OnboardingView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ready: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText("6 of 6")).toBeVisible();
    await expect(canvas.getByText("All 248 passed", { exact: false })).toBeVisible();
    await expect(canvas.queryByRole("alert")).toBeNull();
    // Every feature card, and the API tally from the spec.
    await expect(canvas.getAllByRole("article")).toHaveLength(features.length);
    await expect(canvas.getByText("2 of 4")).toBeVisible();
  },
};

/** A fresh clone: nothing seeded, no tests run. The page still works and says what to run. */
export const FreshClone: Story = {
  args: { status: { ...ready, database: { ...ready.database, state: "missing", schemaVersion: null, tables: [] }, tests: null } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("alert")).toHaveTextContent("The store can't load yet. There is no database yet at .data/farmart.sqlite. Run npm run db:seed.");
    await expect(canvas.getByText("3 of 6")).toBeVisible();
    await expect(canvas.getByText("Not created")).toBeVisible();
    await expect(canvas.getByText("Not run yet. Results show up at /test-report.")).toBeVisible();
  },
};

/** The schema changed since seeding: the seed step points at db:reset instead. */
export const OutdatedDatabase: Story = {
  args: { status: { ...ready, database: { ...ready.database, state: "outdated", schemaVersion: 0 + 1, expectedSchemaVersion: 2 } } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("alert")).toHaveTextContent("needs version 2");
    await expect(canvas.getAllByText("npm run db:reset").length).toBeGreaterThan(0);
  },
};

/** Seeded, but someone deleted a product and a test fails: both steps turn into problems. */
export const DriftAndFailingTests: Story = {
  args: {
    status: {
      ...ready,
      database: { ...ready.database, tables: SEEDED.map((t) => (t.table === "products" ? { ...t, rows: 15 } : t)) },
      tests: { ...ready.tests!, passed: 246, failed: 2 },
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("products has 15 rows, src/data has 16", { exact: false })).toBeVisible();
    await expect(canvas.getByText("2 failed")).toBeVisible();
    await expect(canvas.getAllByRole("img", { name: "Needs attention" })).toHaveLength(2);
  },
};
