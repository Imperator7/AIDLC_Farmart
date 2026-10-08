import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { brands, categories, heroBanner, promoBanner } from "@/data/home";
import Countdown from "./countdown";
import { Arrows, BrandCard, CategoryTile, HeroBanner, PromoBanner, SectionTitle, SignupCard } from "./home-sections";

/** DESIGN.md: hero-banner, promo-banner, countdown-chip, section-title, carousel-arrow, category-tile, brand-card, signup-card. */
const meta = {
  title: "Components/Home sections",
  component: HeroBanner,
  args: { banner: heroBanner },
  tags: ["autodocs"],
  globals: { backgrounds: { value: "soft" } },
} satisfies Meta<typeof HeroBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Text column + photo column; text never overlaps the photo. */
export const Hero: Story = {
  decorators: [(Story) => <div className="max-w-3xl">{Story()}</div>],
};

export const Promo: Story = {
  render: () => (
    <div className="max-w-sm">
      <PromoBanner banner={promoBanner} />
    </div>
  ),
};

export const CountdownChip: Story = { render: () => <Countdown /> };

export const SectionHeader: Story = {
  globals: { backgrounds: { value: "canvas" } },
  render: () => (
    <div className="max-w-3xl">
      <SectionTitle title="Browse by Category" link="All Categories">
        <Arrows activeRight />
      </SectionTitle>
    </div>
  ),
};

export const CategoryTiles: Story = {
  globals: { backgrounds: { value: "canvas" } },
  render: () => (
    <div className="grid max-w-3xl grid-cols-8 gap-4">
      {categories.map((c) => (
        <CategoryTile key={c.slug} c={c} />
      ))}
    </div>
  ),
};

export const BrandCards: Story = {
  globals: { backgrounds: { value: "canvas" } },
  render: () => (
    <div className="grid max-w-4xl grid-cols-4 gap-5">
      {brands.map((b) => (
        <BrandCard key={b.id} b={b} />
      ))}
    </div>
  ),
};

/** signup-card with input-fields. */
export const Signup: Story = {
  globals: { backgrounds: { value: "canvas" } },
  render: () => (
    <div className="max-w-xs">
      <SignupCard />
    </div>
  ),
};
