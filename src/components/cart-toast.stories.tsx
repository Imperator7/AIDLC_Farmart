import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { bestSellers, topSaver } from "@/data/home";
import { CartToastCard } from "./cart-toast";
import { CartControl } from "./product-card";

/** DESIGN.md: cart-toast. The live toast is mounted once by the preview decorator (as in app/layout.tsx). */
const meta = {
  title: "Overlays/Cart toast",
  component: CartToastCard,
  args: { name: topSaver[0].name, total: 12.4 },
  decorators: [(Story) => <div className="max-w-[360px]">{Story()}</div>],
} satisfies Meta<typeof CartToastCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Under $50: says how much more unlocks free delivery. */
export const BelowFreeDelivery: Story = {};

export const FreeDeliveryUnlocked: Story = { args: { name: bestSellers[1].name, total: 58.2 } };

/** Press + Add: the real toast rises bottom-right with the running total, then leaves after 4s. */
export const Live: Story = {
  beforeEach: () => {
    localStorage.removeItem("farmart-cart");
  },
  render: () => (
    <div className="w-48">
      <CartControl p={topSaver[0]} />
    </div>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: `Add ${topSaver[0].name} to cart` }));
    // The toast is mounted outside the story root, so look in the whole page.
    const toast = await within(canvasElement.ownerDocument.body).findByText(`Added ${topSaver[0].name}`);
    await expect(toast).toBeInTheDocument();
  },
};
