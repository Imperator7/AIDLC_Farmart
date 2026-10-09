import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import E2EView, { E2EEmpty } from "./e2e-view";
import type { E2EReport } from "./types";

// The /overview screenshots stand in for test screenshots.
const shot = (name: string, kind: E2EReport["files"][number]["cases"][number]["images"][number]["kind"], file: string) => ({ name, kind, src: `/overview/${file}.jpg` });

const passing: E2EReport = {
  ranAt: "2026-10-10T09:15:00.000Z",
  durationMs: 21_400,
  counts: { total: 3, passed: 3, failed: 0, flaky: 0, skipped: 0 },
  visual: { total: 1, failed: 0 },
  files: [
    {
      file: "e2e/cart.spec.ts",
      cases: [
        {
          id: "cart-1",
          title: "add, change the quantity, remove, from the card and the drawer",
          group: "Cart",
          file: "e2e/cart.spec.ts",
          line: 5,
          project: "desktop",
          status: "passed",
          durationMs: 2_310,
          visual: false,
          images: [shot("toast after add", "step", "home"), shot("drawer with 2 bananas", "step", "cart"), shot("screenshot", "final", "clear")],
        },
        {
          id: "cart-2",
          title: "image test: the open drawer matches the baseline",
          group: "Cart",
          file: "e2e/cart.spec.ts",
          line: 53,
          project: "desktop",
          status: "passed",
          durationMs: 1_120,
          visual: true,
          images: [shot("cart-drawer.png", "baseline", "cart"), shot("screenshot", "final", "cart")],
        },
      ],
    },
    {
      file: "e2e/search.spec.ts",
      cases: [
        {
          id: "search-1",
          title: "suggests products while typing, and Enter opens the results",
          group: "Search",
          file: "e2e/search.spec.ts",
          line: 5,
          project: "desktop",
          status: "passed",
          durationMs: 1_840,
          visual: false,
          images: [shot("results for oat", "step", "search")],
        },
      ],
    },
  ],
};

const failing: E2EReport = {
  ...passing,
  counts: { total: 3, passed: 2, failed: 1, flaky: 0, skipped: 0 },
  visual: { total: 1, failed: 1 },
  files: [
    {
      file: "e2e/home.spec.ts",
      cases: [
        {
          id: "home-1",
          title: "image test: the page above the fold matches the baseline",
          group: "Home page",
          file: "e2e/home.spec.ts",
          line: 40,
          project: "desktop",
          status: "failed",
          durationMs: 3_050,
          visual: true,
          error: "Error: Screenshot comparison failed:\n\n  41213 pixels (ratio 0.05 of all image pixels) are different.",
          images: [shot("home-expected.png", "expected", "home"), shot("home-actual.png", "actual", "pdp"), shot("home-diff.png", "diff", "error")],
        },
      ],
    },
    ...passing.files,
  ],
};

const meta = {
  title: "Tools/E2E report",
  component: E2EView,
  parameters: { layout: "padded" },
  args: { report: passing },
  globals: { backgrounds: { value: "soft" } },
} satisfies Meta<typeof E2EView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllPassed: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("heading", { name: "All 3 end-to-end tests passed" })).toBeVisible();
    await expect(canvas.getByText("Approved baseline")).toBeVisible();
    await expect(canvas.getByRole("img", { name: "drawer with 2 bananas screenshot" })).toBeVisible();
  },
};

/** A failed image test shows expected, actual and the difference side by side, and comes first. */
export const ImageTestFailed: Story = {
  args: { report: failing },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("heading", { name: "1 of 3 end-to-end tests failed" })).toBeVisible();
    await expect(canvas.getByText("Difference")).toBeVisible();
    await expect(canvas.getByText(/Screenshot comparison failed/)).toBeVisible();
  },
};

export const NoReportYet: Story = { render: () => <E2EEmpty /> };
