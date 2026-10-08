import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import ProjectSummary from "./project-summary";

/** The "Project overview" section at the top of /overview. On the page the numbers are counted from the source at build time. */
const meta = {
  title: "Tools/Project overview",
  component: ProjectSummary,
  parameters: { layout: "fullscreen" },
  args: {
    stats: {
      routes: [
        { route: "/", title: "Home", area: "Store", pages: 1, href: "/" },
        { route: "/products/[id]", title: "Product detail", area: "Store", pages: 16, href: "/products/ts1" },
        { route: "/design", title: "Design system", area: "Dev tool", pages: 1, href: "/design" },
        { route: "/design/[slug]", title: "Design page", area: "Dev tool", pages: 17, href: "/design/colors" },
        { route: "/overview", title: "UI overview", area: "Dev tool", pages: 1, href: "/overview" },
      ],
      pagesTotal: 36,
      storePages: 17,
      products: 16,
      categories: 8,
      brands: 4,
      overlays: 3,
      planned: ["Checkout", "Category & deal pages"],
      components: 37,
      colors: 24,
      knownGaps: 3,
      stories: 47,
      storyFiles: 11,
      stack: [
        { name: "Next.js", version: "16.3.8" },
        { name: "React", version: "19.2.8" },
        { name: "TypeScript", version: "5" },
        { name: "Tailwind CSS", version: "4" },
        { name: "React Flow", version: "12.12.0" },
        { name: "Storybook", version: "10.6.1" },
      ],
    },
  },
} satisfies Meta<typeof ProjectSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText("36", { selector: "p" })).toBeInTheDocument();
    await expect(canvas.getAllByRole("link", { name: "Open →" })).toHaveLength(5);
  },
};
