import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Header from "./header";

/** DESIGN.md: search-bar, nav-category-button, nav-link, count-badge. Click the cart icon to open the drawer. */
const meta = {
  title: "Components/Header",
  component: Header,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Header>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = {};

/** Below 1024px the nav links collapse into the MENU dropdown. */
export const Mobile: Story = {
  globals: { viewport: { value: "mobile1", isRotated: false } },
};
