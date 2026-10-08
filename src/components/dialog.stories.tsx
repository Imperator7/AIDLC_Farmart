import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { fn } from "storybook/test";
import Dialog, { DialogPanel } from "./dialog";
import { Button } from "./ui";

/** DESIGN.md: dialog. Follows the shared Overlays pattern (scrim → container → header → body → footer). */
const meta = {
  title: "Overlays/Dialog",
  component: DialogPanel,
  tags: ["autodocs"],
  args: {
    title: "Apply member discount?",
    children: "Your 15% new-member code will be applied to this order.",
    confirmLabel: "Apply 15% off",
    tone: "default",
    onConfirm: fn(),
    onCancel: fn(),
  },
  argTypes: { tone: { control: "inline-radio", options: ["default", "danger"] } },
  decorators: [
    (Story) => (
      <div className="flex min-h-80 items-center justify-center bg-black/40 p-6">
        <div className="w-full max-w-[400px]">
          <Story />
        </div>
      </div>
    ),
  ],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof DialogPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Destructive: danger button, focus starts on Cancel. */
export const Danger: Story = {
  args: {
    title: "Clear your cart?",
    children: "All 4 items will be removed. This can't be undone.",
    confirmLabel: "Clear cart",
    tone: "danger",
  },
};

/** Without confirmLabel it's a notice with a single Close button. */
export const Notice: Story = {
  args: { title: "Delivery slot saved", children: "We'll deliver tomorrow between 9:00 and 11:00.", confirmLabel: undefined },
};

/** The real modal: native <dialog>, focus trap, Escape, scrim click. */
export const Live: Story = {
  decorators: [(Story) => <div className="p-6">{Story()}</div>],
  render: function Render(args) {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant={args.tone === "danger" ? "danger" : "primary"} onClick={() => setOpen(true)}>
          Open dialog
        </Button>
        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          title={args.title}
          confirmLabel={args.confirmLabel}
          onConfirm={args.onConfirm}
          tone={args.tone}
        >
          {args.children}
        </Dialog>
      </>
    );
  },
};
