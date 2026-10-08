import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FREE_DELIVERY_FROM } from "@/data/store";
import SiteHeader from "@/components/site-header";
import { SectionTitle } from "@/components/home-sections";
import { Accordion, BenefitList, benefitIcons, Breadcrumb, PriceBlock, StockBadge, Tag } from "@/components/pdp";
import ProductCard, { CartControl, Stars } from "@/components/product-card";
import ProductGallery from "@/components/product-gallery";
import { SiteFooter } from "@/components/store-chrome";
import { allProducts, discountPercent, getProduct, relatedProducts } from "@/data/home";
import { productDetails } from "@/data/product-details";

// Layout follows DESIGN.md › Layout › Product Detail Page.

export const dynamicParams = false;

export function generateStaticParams() {
  return allProducts.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: PageProps<"/products/[id]">): Promise<Metadata> {
  const p = getProduct((await params).id);
  if (!p) return {};
  return { title: `${p.name} - Farmart`, description: productDetails[p.id]?.description };
}

export default async function ProductPage({ params }: PageProps<"/products/[id]">) {
  const p = getProduct((await params).id);
  if (!p) notFound();
  const details = productDetails[p.id];
  const left = p.stock !== undefined && p.sold !== undefined ? p.stock - p.sold : undefined;

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 pt-4">
          <Breadcrumb items={[{ label: "Home", href: "/" }, { label: p.category }, { label: p.name }]} />
        </div>

        {/* Buy area */}
        <section className="mx-auto grid max-w-6xl gap-8 px-4 py-6 lg:grid-cols-2">
          <ProductGallery images={[p.image]} alt={p.name} discount={discountPercent(p)} />

          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs font-semibold tracking-widest text-amber-700 uppercase">{p.brand}</p>
              <h1 className="mt-1 text-2xl leading-tight font-bold text-gray-900">{p.name}</h1>
              <div className="mt-2 flex items-center gap-2">
                <Stars rating={p.rating} reviews={p.reviews} />
                <span className="text-[11px] text-gray-500">{p.reviews} reviews</span>
              </div>
            </div>

            <PriceBlock p={p} />
            <div>
              <StockBadge left={left} />
            </div>

            {details && (
              <ul className="flex flex-wrap gap-2">
                {details.highlights.slice(0, 3).map((h) => (
                  <li key={h}>
                    <Tag>{h}</Tag>
                  </li>
                ))}
              </ul>
            )}

            <hr className="border-gray-200" />

            <div className="max-w-sm">
              <CartControl p={p} size="lg" />
            </div>

            <BenefitList
              items={[
                { icon: benefitIcons.truck, text: <>Free delivery on orders over <b>${FREE_DELIVERY_FROM}</b></> },
                { icon: benefitIcons.leaf, text: "Freshness guaranteed or your money back" },
                { icon: benefitIcons.refresh, text: "Easy returns within 24 hours of delivery" },
              ]}
            />
          </div>
        </section>

        {/* Information */}
        {details && (
          <section className="mx-auto max-w-6xl px-4 pb-12">
            <div className="max-w-3xl">
              <Accordion
                items={[
                  { title: "Description", open: true, content: <p>{details.description}</p> },
                  {
                    title: "Product details",
                    content: (
                      <dl className="grid grid-cols-[120px_1fr] gap-y-2">
                        <dt className="text-gray-500">Brand</dt>
                        <dd>{p.brand}</dd>
                        <dt className="text-gray-500">Category</dt>
                        <dd>{p.category}</dd>
                        <dt className="text-gray-500">Size</dt>
                        <dd>{p.unit}</dd>
                        <dt className="text-gray-500">Origin</dt>
                        <dd>{details.origin}</dd>
                        <dt className="text-gray-500">Storage</dt>
                        <dd>{details.storage}</dd>
                      </dl>
                    ),
                  },
                  {
                    title: "Delivery & returns",
                    content: (
                      <p>
                        Delivered chilled in insulated bags. Delivery is free on orders over ${FREE_DELIVERY_FROM}, otherwise $4.99. If anything
                        isn&apos;t fresh, tell us within 24 hours and we&apos;ll refund it.
                      </p>
                    ),
                  },
                ]}
              />
            </div>
          </section>
        )}

        {/* Related products */}
        <section className="bg-gray-100 py-10">
          <div className="mx-auto max-w-6xl px-4">
            <SectionTitle title="You may also like" />
            <div className="grid grid-cols-2 gap-px bg-white sm:grid-cols-3 lg:grid-cols-6">
              {relatedProducts(p).map((r) => (
                <ProductCard key={r.id} p={r} />
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
