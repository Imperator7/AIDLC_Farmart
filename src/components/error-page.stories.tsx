import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";
import ErrorPage from "./error-page";

const meta = {
  title: "Components/Error page",
  component: ErrorPage,
  parameters: { layout: "fullscreen" },
  args: { reference: "923602889", onRetry: fn() },
} satisfies Meta<typeof ErrorPage>;

export default meta;
type Story = StoryObj<typeof meta>;

/** What customers see in production: no error text, just a way forward and a reference to quote. */
export const Production: Story = {
  play: async ({ canvas, args }) => {
    await expect(canvas.getByRole("heading", { name: "We couldn't load this page" })).toBeVisible();
    await expect(canvas.getByText("923602889")).toBeVisible();
    await expect(canvas.queryByText("Development only")).toBeNull();
    await expect(canvas.getByRole("link", { name: "Go to the home page" })).toHaveAttribute("href", "/");
    await canvas.getByRole("button", { name: "Try again" }).click();
    await expect(args.onRetry).toHaveBeenCalledOnce();
  },
};

/** In `npm run dev` the real message is shown too, labelled, so the developer doesn't need the terminal. */
export const Development: Story = {
  args: { devDetail: "There is no database at .data/farmart.sqlite. Run `npm run db:seed`." },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Development only")).toBeVisible();
    await expect(canvas.getByText(/Run `npm run db:seed`/)).toBeVisible();
  },
};

/** An error without a digest (thrown in the browser): no reference line. */
export const WithoutReference: Story = {
  args: { reference: undefined },
  play: async ({ canvas }) => {
    await expect(canvas.queryByText(/Reference:/)).toBeNull();
  },
};
