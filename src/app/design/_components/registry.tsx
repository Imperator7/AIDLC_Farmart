import Link from "next/link";
import { bestSellers, brands, categories, heroBanner, promoBanner, topSaver } from "@/data/home";
import { Accordion, BenefitList, benefitIcons, Breadcrumb, PriceBlock, StockBadge, Tag } from "@/components/pdp";
import ProductGallery from "@/components/product-gallery";
import Countdown from "@/components/countdown";
import { CartToastCard } from "@/components/cart-toast";
import { CartControlDemo, DialogDemo, OpenCartButton } from "@/components/design-specimens";
import { DialogPanel } from "@/components/dialog";
import { ErrorPanel } from "@/components/error-page";
import Header from "@/components/header";
import { Arrows, BrandCard, CategoryTile, HeroBanner, PromoBanner, SectionTitle, SignupCard } from "@/components/home-sections";
import ProductCard, { SoldBar } from "@/components/product-card";
import { SuggestionsPanel } from "@/components/search-bar";
import { suggestionOptions } from "@/lib/search";
import { FilterChip, Pagination, SearchEmpty } from "@/components/search-results";
import SortSelect from "@/components/sort-select";
import { SiteFooter, TrustStrip } from "@/components/store-chrome";
import { Button, CountBadge, DiscountBadge } from "@/components/ui";
import { OverlayAnatomy } from "./parts";

export type Section = "Foundations" | "Patterns" | "Components" | "Guidelines";

export type DesignPageDef = {
  slug: string;
  title: string;
  section: Section;
  summary: string;
  /** Foundation/guideline pages are rendered from DESIGN.md data by kind. */
  kind?: "colors" | "typography" | "shape" | "elevation" | "overlays" | "responsive" | "gaps";
  /** Component pages: DESIGN.md `components:` keys documented on this page. */
  keys?: string[];
  specimen?: React.ReactNode;
  /** Extra content shown above the specs (e.g. anatomy). */
  intro?: React.ReactNode;
};

export const sections: Section[] = ["Foundations", "Patterns", "Components", "Guidelines"];

export const pages: DesignPageDef[] = [
  { slug: "colors", title: "Colors", section: "Foundations", kind: "colors", summary: "Every color has a job. Names describe the role, not the hue." },
  { slug: "typography", title: "Typography", section: "Foundations", kind: "typography", summary: "One family. Hierarchy comes from weight and color more than size." },
  { slug: "radius-spacing", title: "Radius & Spacing", section: "Foundations", kind: "shape", summary: "Corner radii and the spacing scale." },
  { slug: "elevation", title: "Elevation", section: "Foundations", kind: "elevation", summary: "Flat by default. Shadows only signal interaction or overlay." },

  {
    slug: "overlays",
    title: "Overlays",
    section: "Patterns",
    kind: "overlays",
    summary: "What an overlay is, when to use a dialog vs the drawer, and the shared anatomy and behavior.",
  },

  {
    slug: "buttons",
    title: "Buttons",
    section: "Components",
    summary: "Amber buys, dark and light adapt to their surface, ghost backs out, danger destroys.",
    keys: ["button-primary", "button-primary-hover", "button-dark", "button-light", "button-ghost", "button-danger"],
    specimen: (
      <div className="flex flex-wrap items-center gap-4">
        <Button>Register Now</Button>
        <Button className="bg-amber-500">Hover state</Button>
        <Button variant="dark">Shop Now</Button>
        <div className="rounded bg-amber-400 p-3">
          <Button variant="light">Shop Now</Button>
        </div>
        <Button variant="ghost">Cancel</Button>
        <Button variant="danger">Clear cart</Button>
        <Button size="lg" className="w-56">
          Checkout (lg)
        </Button>
      </div>
    ),
  },
  {
    slug: "cart-controls",
    title: "Cart controls",
    section: "Components",
    summary: "The Add pill that turns into a quantity stepper bound to the cart. md on cards, lg on the product page.",
    keys: ["add-button", "qty-stepper", "add-button-lg", "qty-stepper-lg"],
    specimen: (
      <div className="flex flex-wrap items-end gap-8">
        <div>
          <p className="mb-2 text-[11px] text-gray-500">md (cards). Try it: Add → − / + → trash</p>
          <CartControlDemo />
        </div>
        <div>
          <p className="mb-2 text-[11px] text-gray-500">lg (product page, 48px)</p>
          <CartControlDemo size="lg" />
        </div>
      </div>
    ),
  },
  {
    slug: "product",
    title: "Product",
    section: "Components",
    summary: "Product cards and the urgency details on them.",
    keys: ["product-card", "product-card-featured", "badge-discount", "sold-bar"],
    specimen: (
      <div className="flex flex-wrap items-start gap-6">
        <div className="grid w-full max-w-md grid-cols-2 gap-px">
          <ProductCard p={topSaver[0]} featured />
          <ProductCard p={topSaver[3]} />
        </div>
        <div className="space-y-4">
          <DiscountBadge percent={15} />
          <div className="w-40">
            <SoldBar sold={32} stock={60} />
          </div>
        </div>
      </div>
    ),
  },
  {
    slug: "product-detail",
    title: "Product detail",
    section: "Components",
    summary: "The building blocks of the product page: breadcrumb, gallery, price, stock, tags, benefits and accordion.",
    keys: ["breadcrumb", "product-gallery", "price-block", "stock-badge", "tag", "benefit-list", "accordion"],
    specimen: (
      <div className="space-y-6">
        <div className="rounded-md bg-white p-4">
          <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Fruits & Vegetables" }, { label: "Blood Oranges, Sweet & Juicy" }]} />
        </div>
        <div className="grid gap-6 rounded-md bg-white p-5 md:grid-cols-2">
          <div>
            <p className="mb-2 text-[11px] text-gray-500">Gallery with 3 photos (thumbnails appear when there&apos;s more than one)</p>
            <ProductGallery images={[topSaver[3].image, bestSellers[0].image, bestSellers[2].image]} alt="Gallery demo" discount={15} />
          </div>
          <div className="space-y-5">
            <PriceBlock p={topSaver[3]} />
            <PriceBlock p={bestSellers[0]} />
            <div className="flex flex-wrap gap-2">
              <StockBadge />
              <StockBadge left={8} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Tag>Seasonal</Tag>
              <Tag>Rich in vitamin C</Tag>
              <Tag>Easy to peel</Tag>
            </div>
            <BenefitList
              items={[
                { icon: benefitIcons.truck, text: "Free delivery on orders over $50" },
                { icon: benefitIcons.leaf, text: "Freshness guaranteed or your money back" },
                { icon: benefitIcons.refresh, text: "Easy returns within 24 hours of delivery" },
              ]}
            />
          </div>
        </div>
        <div className="rounded-md bg-white p-5">
          <Accordion
            items={[
              { title: "Description", open: true, content: <p>Deep ruby-red flesh with a sweet, raspberry-like flavour.</p> },
              { title: "Product details", content: <p>Origin: Sicily, Italy · Size: 1kg</p> },
              { title: "Delivery & returns", content: <p>Delivered chilled. Free over $50.</p> },
            ]}
          />
        </div>
        <Link href="/products/ts4" className="inline-block text-sm font-semibold text-amber-700 underline">
          See them together on a real product page →
        </Link>
      </div>
    ),
  },
  {
    slug: "merchandising",
    title: "Merchandising",
    section: "Components",
    summary: "Hero and promo banners, and the countdown chip.",
    keys: ["hero-banner", "promo-banner", "countdown-chip"],
    specimen: (
      <div className="space-y-5">
        <div className="grid gap-5 md:grid-cols-3">
          <HeroBanner banner={heroBanner} className="md:col-span-2" />
          <PromoBanner banner={promoBanner} />
        </div>
        <Countdown />
      </div>
    ),
  },
  {
    slug: "browse",
    title: "Browse",
    section: "Components",
    summary: "Section titles, carousel arrows, category tiles and brand cards.",
    keys: ["section-title", "carousel-arrow", "category-tile", "brand-card"],
    specimen: (
      <div className="rounded-md bg-white p-5">
        <SectionTitle title="Browse by Category" link="All Categories">
          <Arrows activeRight />
        </SectionTitle>
        <div className="grid grid-cols-4 gap-4 md:grid-cols-8">
          {categories.slice(0, 4).map((c) => (
            <CategoryTile key={c.slug} c={c} />
          ))}
          <div className="col-span-4 grid grid-cols-2 gap-4">
            {brands.slice(0, 2).map((b) => (
              <BrandCard key={b.id} b={b} />
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    slug: "navigation",
    title: "Header & navigation",
    section: "Components",
    summary: "Search, nav links, the category button and count badges.",
    keys: ["search-bar", "count-badge", "nav-category-button", "nav-link"],
    specimen: (
      <div className="space-y-4">
        <div className="overflow-hidden rounded-md border border-gray-200">
          <Header categories={categories} />
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <CountBadge count={3} /> count-badge
        </div>
      </div>
    ),
  },
  {
    slug: "search",
    title: "Search",
    section: "Components",
    summary: "Autocomplete under the search bar, and the filters, sort, paging and empty state of the results page.",
    keys: ["search-suggestions", "filter-chip", "sort-select", "pagination", "search-empty"],
    specimen: (
      <div className="space-y-8">
        {/* The panel hangs off the field, as under the real search-bar; the padding leaves room for it. */}
        <div className="max-w-xl pb-72">
          <div className="relative flex h-10 items-center rounded-md bg-gray-100 px-4 text-sm text-gray-900">
            be
            <SuggestionsPanel
              id="specimen-suggestions"
              query="be"
              activeIndex={0}
              options={suggestionOptions({
                query: "be",
                products: [bestSellers[1], topSaver[1], topSaver[0]],
                categories: [],
              })}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FilterChip href="/design/search">All categories</FilterChip>
          <FilterChip href="/design/search" active>
            Raw Meats
          </FilterChip>
          <FilterChip href="/design/search">On sale</FilterChip>
          <span className="ml-auto">
            <SortSelect value="price_asc" params={{ q: "beef" }} />
          </span>
        </div>
        <Pagination page={1} totalPages={3} hrefFor={() => "/design/search"} />
        <div className="bg-gray-100 p-4">
          <SearchEmpty query="zzz" clearHref="/design/search" />
        </div>
      </div>
    ),
  },
  {
    slug: "error-page",
    title: "Error page",
    section: "Components",
    summary: "What a page shows when it fails on the server: a way forward and a reference, never the error itself.",
    keys: ["error-page"],
    specimen: (
      <div className="space-y-6">
        <div className="bg-gray-100 p-4">
          <ErrorPanel reference="923602889" />
        </div>
        <div className="bg-gray-100 p-4">
          <ErrorPanel reference="923602889" devDetail="There is no database at .data/farmart.sqlite. Run `npm run db:seed`." />
        </div>
      </div>
    ),
  },
  {
    slug: "forms",
    title: "Forms",
    section: "Components",
    summary: "Input fields and the member sign-up card.",
    keys: ["input-field", "signup-card"],
    specimen: (
      <div className="max-w-xs">
        <SignupCard />
      </div>
    ),
  },
  {
    slug: "dialog",
    title: "Dialog",
    section: "Components",
    summary: "A centered overlay that asks for one decision.",
    keys: ["dialog"],
    intro: <OverlayAnatomy kind="dialog" />,
    specimen: (
      <div className="space-y-6">
        <div className="grid gap-6 rounded-md bg-black/40 p-6 md:grid-cols-2">
          <div className="mx-auto w-full max-w-[400px]">
            <DialogPanel title="Apply member discount?" confirmLabel="Apply 15% off">
              Your 15% new-member code will be applied to this order.
            </DialogPanel>
          </div>
          <div className="mx-auto w-full max-w-[400px]">
            <DialogPanel title="Clear your cart?" tone="danger" confirmLabel="Clear cart">
              All 4 items will be removed. This can&apos;t be undone.
            </DialogPanel>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <DialogDemo />
        </div>
      </div>
    ),
  },
  {
    slug: "cart-drawer",
    title: "Cart drawer",
    section: "Components",
    summary: "A right-edge overlay where the customer reviews and edits the basket.",
    keys: ["cart-drawer"],
    intro: <OverlayAnatomy kind="drawer" />,
    specimen: <OpenCartButton />,
  },
  {
    slug: "cart-toast",
    title: "Cart toast",
    section: "Components",
    summary: "A non-modal confirmation after + Add, carrying the running total the header can't show once it scrolls away.",
    keys: ["cart-toast"],
    specimen: (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <CartToastCard name={topSaver[0].name} total={12.4} />
          <CartToastCard name={bestSellers[1].name} total={58.2} />
        </div>
        <p className="text-xs text-gray-500">Live: add any product on this site (or use the cart-controls page) and the real toast rises in the bottom-right corner for 4 seconds.</p>
      </div>
    ),
  },
  {
    slug: "store-chrome",
    title: "Trust strip & footer",
    section: "Components",
    summary: "The store's promises under the nav, and the footer that closes every store page.",
    keys: ["trust-strip", "site-footer"],
    specimen: (
      <div className="space-y-6">
        <div className="overflow-hidden rounded-md border border-gray-200">
          <TrustStrip />
        </div>
        <div className="overflow-hidden rounded-md border border-gray-200">
          <SiteFooter />
        </div>
      </div>
    ),
  },

  { slug: "responsive", title: "Responsive", section: "Guidelines", kind: "responsive", summary: "Breakpoints, touch targets and how layouts collapse." },
  { slug: "known-gaps", title: "Known Gaps", section: "Guidelines", kind: "gaps", summary: "What the system intentionally does not cover yet." },
];

export const pageBySlug = (slug: string) => pages.find((p) => p.slug === slug);

/** Overlay component pages link back to the shared pattern. */
export const overlaySlugs = ["dialog", "cart-drawer"];
