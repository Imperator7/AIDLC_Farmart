import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { Button } from "./ui";

/** DESIGN.md: button-primary, button-dark, button-light, button-ghost, button-danger. */
const meta = {
  title: "Components/Buttons",
  component: Button,
  tags: ["autodocs"],
  args: { children: "Register Now", onClick: fn() },
  argTypes: {
    variant: { control: "inline-radio", options: ["primary", "dark", "light", "ghost", "danger"] },
    size: { control: "inline-radio", options: ["md", "lg"] },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = { args: { variant: "primary" } };

/** On white banners; hover flips it to amber. */
export const Dark: Story = { args: { variant: "dark", children: "Shop Now" } };

/** Only on amber surfaces, where amber-on-amber would vanish. */
export const Light: Story = {
  args: { variant: "light", children: "Shop Now" },
  globals: { backgrounds: { value: "amber" } },
};

/** The quiet "back out" action, always paired with a stronger button. */
export const Ghost: Story = { args: { variant: "ghost", children: "Cancel" } };

/** Confirms an irreversible action; only inside a dialog. */
export const Danger: Story = { args: { variant: "danger", children: "Clear cart" } };

/** Full-width drawer actions such as Checkout. */
export const Large: Story = {
  args: { size: "lg", children: "Checkout", className: "w-80" },
};
