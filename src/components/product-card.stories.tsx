import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { bestSellers, featuredId, justLanding, topSaver } from "@/data/home";
import ProductCard from "./product-card";

/** DESIGN.md: product-card, product-card-featured (with badge-discount and sold-bar). */
const meta = {
  title: "Components/Product card",
  component: ProductCard,
  tags: ["autodocs"],
  args: { p: bestSellers[0], featured: false },
  decorators: [
    (Story) => (
      <div className="w-52">
        <Story />
      </div>
    ),
  ],
  globals: { backgrounds: { value: "soft" } },
} satisfies Meta<typeof ProductCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Old price → Save x% badge and red price. */
export const Discounted: Story = { args: { p: justLanding[3] } };

/** Top Saver items show sold progress. */
export const WithSoldBar: Story = { args: { p: topSaver[1] } };

/** First card of a row: bordered and lifted. */
export const Featured: Story = { args: { p: topSaver[0], featured: true } };

/** How cards tile on the shelf: 1px gaps showing the gray floor; the biggest saving is featured. */
export const Row: Story = {
  globals: { backgrounds: { value: "soft" } },
  decorators: [(Story) => <div className="w-[960px]">{Story()}</div>],
  render: () => {
    const row = bestSellers.slice(0, 5);
    const featured = featuredId(row);
    return (
      <div className="grid grid-cols-5 gap-px">
        {row.map((p) => (
          <ProductCard key={p.id} p={p} featured={p.id === featured} />
        ))}
      </div>
    );
  },
};
