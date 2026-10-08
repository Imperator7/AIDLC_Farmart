import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { allProducts } from "@/data/home";
import FlowCanvas from "./flow-canvas";
import { buildFlow } from "./flow-graph";

/** The /overview page map: every page and overlay and the links between them. */
const { nodes, edges } = buildFlow({ productCount: allProducts.length, designPageCount: 17 });

const meta = {
  title: "Tools/UI overview",
  component: FlowCanvas,
  parameters: { layout: "fullscreen" },
  decorators: [(Story) => <div className="h-[720px]">{Story()}</div>],
  args: { initialNodes: nodes, initialEdges: edges },
} satisfies Meta<typeof FlowCanvas>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  play: async ({ canvas, userEvent }) => {
    await expect(await canvas.findByText("Cart drawer")).toBeInTheDocument();
    await userEvent.click(canvas.getByText("Product detail"));
    await expect(await canvas.findByRole("complementary", { name: "Product detail details" })).toBeInTheDocument();
  },
};
