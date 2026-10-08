/** Search helpers shared by server and client code (so they can't live in a "use client" module). */
import type { SearchSuggestions } from "@/data/home";

/** The /search URL for a set of filters; blank values are left out so links stay short. */
export function searchHref(params: Record<string, string | undefined>) {
  const qs = new URLSearchParams(Object.entries(params).filter((e): e is [string, string] => !!e[1]?.trim()));
  return qs.size ? `/search?${qs}` : "/search";
}

export type SearchOption = { key: string; href: string } & (
  | { kind: "product"; name: string; image: string; price: number }
  | { kind: "category"; name: string }
  | { kind: "search"; query: string }
);

/** Products first, then categories, then "Search for q", which runs the full search. */
export function suggestionOptions(data: SearchSuggestions, category?: string): SearchOption[] {
  if (!data.products.length && !data.categories.length) return [];
  return [
    ...data.products.map((p): SearchOption => ({ key: `p-${p.id}`, href: `/products/${p.id}`, kind: "product", ...p })),
    ...data.categories.map((c): SearchOption => ({ key: `c-${c.slug}`, href: searchHref({ category: c.slug }), kind: "category", name: c.name })),
    { key: "search", href: searchHref({ q: data.query, category }), kind: "search", query: data.query },
  ];
}
