import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SiteFooter, TrustStrip } from "./store-chrome";

/** DESIGN.md: trust-strip, site-footer. */
const meta = {
  title: "Components/Trust strip & footer",
  component: TrustStrip,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof TrustStrip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Strip: Story = {};

/** Wraps to two lines on phones instead of scrolling. */
export const StripMobile: Story = { globals: { viewport: { value: "mobile1", isRotated: false } } };

export const Footer: Story = { render: () => <SiteFooter /> };
