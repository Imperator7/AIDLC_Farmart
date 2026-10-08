import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CountBadge, DiscountBadge } from "./ui";

/** DESIGN.md: badge-discount (red = urgency) and count-badge (amber = basket). */
const meta = {
  title: "Components/Badges",
  component: DiscountBadge,
  tags: ["autodocs"],
  args: { percent: 15 },
} satisfies Meta<typeof DiscountBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Discount: Story = {};

export const Count: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <CountBadge count={0} />
      <CountBadge count={3} />
      <CountBadge count={12} />
    </div>
  ),
};
