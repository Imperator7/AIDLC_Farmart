import { listCategories } from "@/server/catalog";
import Header from "./header";

/** The store header with its search categories read from the catalog database (server only). */
export default function SiteHeader({ query, category }: { query?: string; category?: string }) {
  const categories = listCategories().map(({ slug, name }) => ({ slug, name }));
  return <Header categories={categories} query={query} category={category} />;
}
