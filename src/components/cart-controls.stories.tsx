import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { fn } from "storybook/test";
import { topSaver } from "@/data/home";
import { AddPill, CartControl, QtyPill } from "./product-card";

/** DESIGN.md: add-button, qty-stepper and their -lg variants. */
const meta = {
  title: "Components/Cart controls",
  component: QtyPill,
  tags: ["autodocs"],
  args: { name: "Blood Oranges", qty: 2, onChange: fn(), size: "md" },
  argTypes: { size: { control: "inline-radio", options: ["md", "lg"] } },
  decorators: [
    (Story, { args }) => (
      <div className={args.size === "lg" ? "w-72" : "w-40"}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof QtyPill>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Stepper: Story = {};

/** At quantity 1 the − becomes a trash icon. */
export const StepperAtOne: Story = { args: { qty: 1 } };

export const StepperLarge: Story = { args: { size: "lg", qty: 3 } };

export const AddButton: Story = {
  render: (args) => <AddPill name={args.name} onAdd={fn()} size={args.size} />,
};

export const AddButtonLarge: Story = {
  args: { size: "lg" },
  render: (args) => <AddPill name={args.name} onAdd={fn()} size={args.size} />,
};

/** Local state only: Add → − / + → trash, without touching the real cart. */
export const Interactive: Story = {
  render: function Render(args) {
    const [qty, setQty] = useState(0);
    return qty === 0 ? (
      <AddPill name={args.name} onAdd={() => setQty(1)} size={args.size} />
    ) : (
      <QtyPill name={args.name} qty={qty} onChange={setQty} size={args.size} />
    );
  },
};

/** The real control, bound to the cart (open the cart drawer from a Header story to see it). */
export const BoundToCart: Story = {
  render: (args) => <CartControl p={topSaver[3]} size={args.size} />,
};
