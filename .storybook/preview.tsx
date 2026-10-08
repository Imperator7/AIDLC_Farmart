import type { Preview } from "@storybook/nextjs-vite";
import { Geist, Geist_Mono } from "next/font/google";
import { CartProvider } from "../src/components/cart-context";
import CartDrawer from "../src/components/cart-drawer";
import CartToast from "../src/components/cart-toast";
import "../src/app/globals.css";

// Same fonts as src/app/layout.tsx so stories match the store.
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const preview: Preview = {
  // Every component that touches the cart needs the provider; the drawer lets "open cart" stories work.
  decorators: [
    (Story) => (
      <div className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <CartProvider>
          <Story />
          <CartDrawer />
          <CartToast />
        </CartProvider>
      </div>
    ),
  ],
  parameters: {
    // Components use next/navigation (App Router); this mocks its router in every story.
    nextjs: { appDirectory: true },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    // The store is built on a white canvas with a soft gray floor (DESIGN.md › colors).
    backgrounds: {
      options: {
        canvas: { name: "Canvas", value: "#FFFFFF" },
        soft: { name: "Canvas soft", value: "#F3F4F6" },
        amber: { name: "Primary (amber)", value: "#FFB900" },
      },
    },
    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: "todo",
    },
  },
  initialGlobals: {
    backgrounds: { value: "canvas" },
  },
};

export default preview;
