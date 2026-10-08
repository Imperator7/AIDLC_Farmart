import { featuredId } from "@/data/home";
import Countdown from "@/components/countdown";
import { Arrows, BrowseCategories, FeaturedBrands, HeroBanners, SectionTitle, SignupCard } from "@/components/home-sections";
import ProductCard from "@/components/product-card";
import ProductTabsSection from "@/components/product-tabs-section";
import SiteHeader from "@/components/site-header";
import { SiteFooter, TrustStrip } from "@/components/store-chrome";
import { bestsellers, featuredCategories, listBanners, newArrivals, topSavers } from "@/server/catalog";

// Served from the catalog database and re-rendered at most once a minute, so edits show up without a deploy.
export const revalidate = 60;

export default function Home() {
  // Same queries as GET /api/banners, /api/categories/featured and /api/products/{top-savers,bestsellers,new-arrivals}.
  const banners = listBanners();
  const topSaver = topSavers({ limit: 4 });
  const topSaverFeatured = featuredId(topSaver.data);
  const bestSellers = bestsellers({ period: "week", limit: 6 }).data;
  const justLanding = newArrivals({ limit: 6 }).data;

  return (
    <>
      <SiteHeader />
      <TrustStrip />
      <main className="flex-1">
        {/* The hero headline is a product, so the page gets its own (visually hidden) title. */}
        <h1 className="sr-only">Farmart: fresh groceries and daily deals, delivered</h1>
        <HeroBanners hero={banners.find((b) => b.placement === "hero")} promo={banners.find((b) => b.placement === "hero-side")} />
        <BrowseCategories categories={featuredCategories(8)} />
        <FeaturedBrands brands={banners.filter((b) => b.placement === "brand")} />

        <section className="mx-auto max-w-6xl px-4 pb-12">
          <SectionTitle title="Top Saver Today" link="All Offers">
            {/* Mobile: the chip takes its own line under the title instead of wrapping. */}
            <div className="order-last basis-full sm:order-none sm:basis-auto">
              <Countdown endsAt={topSaver.endsAt} />
            </div>
            <Arrows />
          </SectionTitle>
          <div className="grid gap-5 lg:grid-cols-[3fr_1fr]">
            <div className="grid grid-cols-2 gap-px border border-gray-200 bg-gray-200 md:grid-cols-4">
              {topSaver.data.map((p) => (
                <ProductCard key={p.id} p={p} featured={p.id === topSaverFeatured} />
              ))}
            </div>
            <SignupCard />
          </div>
        </section>

        <div className="bg-gray-100 py-4">
          <ProductTabsSection title="Best Seller" products={bestSellers} />
          <ProductTabsSection title="New Arrivals" products={justLanding} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
