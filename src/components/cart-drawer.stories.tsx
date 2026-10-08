import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useEffect } from "react";
import { bestSellers, topSaver } from "@/data/home";
import { useCart, type CartItem } from "./cart-context";
import { Button } from "./ui";

/**
 * DESIGN.md: cart-drawer. The drawer itself is mounted once by the Storybook
 * preview decorator (as in app/layout.tsx); these stories seed the cart and open it.
 */
function DrawerDemo() {
  const { setOpen } = useCart();
  useEffect(() => setOpen(true), [setOpen]);
  return <Button onClick={() => setOpen(true)}>Open cart drawer</Button>;
}

// The CartProvider restores from localStorage on mount, so seed it *before* render
// (adding items from a story effect would be overwritten by that restore).
const seedCart = (items: CartItem[]) => () => {
  localStorage.setItem("farmart-cart", JSON.stringify(items));
  return () => localStorage.removeItem("farmart-cart");
};

const meta = {
  title: "Overlays/Cart drawer",
  component: DrawerDemo,
  parameters: { layout: "fullscreen" },
  decorators: [(Story) => <div className="min-h-[600px] p-6">{Story()}</div>],
} satisfies Meta<typeof DrawerDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Items, free-delivery progress, summary footer, Clear cart → danger dialog. */
export const Filled: Story = {
  beforeEach: seedCart([
    { product: topSaver[3], qty: 2 },
    { product: bestSellers[0], qty: 1 },
    { product: topSaver[1], qty: 1 },
  ]),
};

/** Over $50: delivery becomes FREE. */
export const FreeDelivery: Story = {
  beforeEach: seedCart([
    { product: topSaver[0], qty: 2 },
    { product: topSaver[2], qty: 1 },
  ]),
};

export const Empty: Story = { beforeEach: seedCart([]) };
