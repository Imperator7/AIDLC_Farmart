import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { bestSellers, topSaver } from "@/data/home";
import { Accordion, BenefitList, benefitIcons, Breadcrumb, PriceBlock, StockBadge, Tag } from "./pdp";
import ProductGallery from "./product-gallery";

/** DESIGN.md › Layout › Product Detail Page building blocks. */
const meta = {
  title: "Components/Product detail",
  component: PriceBlock,
  tags: ["autodocs"],
  args: { p: topSaver[3] },
} satisfies Meta<typeof PriceBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

/** price-block with a discount: red price, struck old price, "You save". */
export const PriceDiscounted: Story = {};

/** price-block at full price: ink, no badge. */
export const PriceRegular: Story = { args: { p: bestSellers[0] } };

/** stock-badge: green in stock, amber when ≤ 20 left (never sale red). */
export const Stock: Story = {
  render: () => (
    <div className="flex gap-2">
      <StockBadge />
      <StockBadge left={15} />
    </div>
  ),
};

export const BreadcrumbTrail: Story = {
  render: () => <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Fruits & Vegetables" }, { label: "Blood Oranges, Sweet & Juicy" }]} />,
};

/** tag: neutral product facts, max 3. */
export const Tags: Story = {
  render: () => (
    <div className="flex gap-2">
      <Tag>Seasonal</Tag>
      <Tag>Rich in vitamin C</Tag>
      <Tag>Easy to peel</Tag>
    </div>
  ),
};

export const Benefits: Story = {
  render: () => (
    <div className="max-w-md">
      <BenefitList
        items={[
          { icon: benefitIcons.truck, text: "Free delivery on orders over $50" },
          { icon: benefitIcons.leaf, text: "Freshness guaranteed or your money back" },
          { icon: benefitIcons.refresh, text: "Easy returns within 24 hours of delivery" },
        ]}
      />
    </div>
  ),
};

export const InfoAccordion: Story = {
  render: () => (
    <div className="max-w-2xl">
      <Accordion
        items={[
          { title: "Description", open: true, content: <p>Deep ruby-red flesh with a sweet, raspberry-like flavour.</p> },
          { title: "Product details", content: <p>Origin: Sicily, Italy · Size: 1kg</p> },
          { title: "Delivery & returns", content: <p>Delivered chilled. Free over $50.</p> },
        ]}
      />
    </div>
  ),
};

/** product-gallery with several photos shows the thumbnail row. */
export const Gallery: Story = {
  render: () => (
    <div className="max-w-md">
      <ProductGallery images={[topSaver[3].image, bestSellers[0].image, bestSellers[2].image]} alt="Gallery demo" discount={15} />
    </div>
  ),
};

/** With a single photo the thumbnail row is hidden. */
export const GallerySingle: Story = {
  render: () => (
    <div className="max-w-md">
      <ProductGallery images={[topSaver[3].image]} alt="Blood oranges" />
    </div>
  ),
};
