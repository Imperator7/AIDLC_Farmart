import type { Metadata } from "next";
import { Breadcrumb } from "@/components/pdp";
import ProductCard from "@/components/product-card";
import { FilterChip, Pagination, SearchEmpty } from "@/components/search-results";
import SiteHeader from "@/components/site-header";
import SortSelect from "@/components/sort-select";
import { SiteFooter } from "@/components/store-chrome";
import { searchHref } from "@/lib/search";
import { listCategories, listProducts } from "@/server/catalog";
import { parseLenient, productQuery, queryObject } from "@/server/validation";

// Layout follows DESIGN.md › Layout › Search Results Page. Same query as GET /api/products.

const PAGE_SIZE = 12; // two full rows at 6-up, divides evenly at 3-up and 2-up

async function readQuery(searchParams: PageProps<"/search">["searchParams"]) {
  return parseLenient(productQuery, { ...queryObject(await searchParams), limit: String(PAGE_SIZE) });
}

export async function generateMetadata({ searchParams }: PageProps<"/search">): Promise<Metadata> {
  const query = await readQuery(searchParams);
  const category = query.category && listCategories().find((c) => c.slug === query.category)?.name;
  return {
    title: `${query.q ? `“${query.q}”` : (category ?? "All products")} - Farmart`,
    robots: { index: false }, // result pages are endless combinations; let crawlers index products instead
  };
}

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const query = await readQuery(searchParams);
  const { data, meta } = listProducts(query);
  const categories = listCategories();
  const category = categories.find((c) => c.slug === query.category);

  // The filters in the URL, so every link changes one thing and keeps the rest.
  const params = {
    q: query.q,
    category: query.category,
    brand: query.brand,
    onSale: query.onSale ? "true" : undefined,
    sort: query.sort === "relevance" ? undefined : query.sort,
  };
  const href = (changes: Record<string, string | undefined>) => searchHref({ ...params, ...changes });
  const filtered = !!(query.category || query.brand || query.onSale);

  const heading = query.q ? `Results for “${query.q}”` : (category?.name ?? (query.brand ? query.brand : "All products"));

  return (
    <>
      <SiteHeader query={query.q} category={query.category} />
      <main className="flex-1">
        <section className="bg-white">
          <div className="mx-auto max-w-6xl px-4 pt-4 pb-5">
            <Breadcrumb
              items={[
                { label: "Home", href: "/" },
                ...(query.q || category || query.brand ? [{ label: "Search", href: "/search" }, { label: heading }] : [{ label: "All products" }]),
              ]}
            />
            <div className="mt-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
              <div className="min-w-0">
                <h1 className="text-2xl leading-tight font-bold break-words text-gray-900">{heading}</h1>
                <p className="mt-1 text-sm text-gray-600" aria-live="polite">
                  {meta.total} {meta.total === 1 ? "product" : "products"}
                  {query.q && category ? ` in ${category.name}` : ""}
                  {query.brand && query.q ? ` from ${query.brand}` : ""}
                  {query.onSale ? ", on sale" : ""}
                </p>
              </div>
              <SortSelect value={query.sort} params={params} />
            </div>

            <nav aria-label="Filter results" className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 py-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
              <FilterChip href={href({ category: undefined })} active={!query.category}>
                All categories
              </FilterChip>
              {categories.map((c) => (
                <FilterChip key={c.slug} href={href({ category: c.slug })} active={c.slug === query.category}>
                  {c.name}
                </FilterChip>
              ))}
              <span aria-hidden className="mx-1 w-px shrink-0 self-stretch bg-gray-200" />
              <FilterChip href={href({ onSale: query.onSale ? undefined : "true" })} active={query.onSale}>
                On sale
              </FilterChip>
              {query.brand && (
                <FilterChip href={href({ brand: undefined })} active>
                  {query.brand}
                </FilterChip>
              )}
            </nav>
          </div>
        </section>

        <section className="bg-gray-100 py-8" aria-label="Results">
          <div className="mx-auto max-w-6xl px-4">
            {data.length ? (
              <div className="grid grid-cols-2 gap-px sm:grid-cols-3 lg:grid-cols-6">
                {data.map((p) => (
                  <ProductCard key={p.id} p={p} />
                ))}
              </div>
            ) : (
              <SearchEmpty query={query.q} clearHref={filtered ? searchHref({ q: query.q, sort: params.sort }) : undefined} />
            )}
            <Pagination page={meta.page} totalPages={meta.totalPages} hrefFor={(page) => href({ page: page > 1 ? String(page) : undefined })} />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
