/**
 * Search results building blocks (DESIGN.md: filter-chip, pagination, search-empty).
 * Server-safe: every control is a link, so filters and paging work without JavaScript.
 */
import Link from "next/link";
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon, SearchIcon } from "./icons";
import { Button } from "./ui";

/** filter-chip: a link that toggles one filter. Amber when on, because amber means "selected". */
export function FilterChip({ href, active = false, children }: { href: string; active?: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "true" : undefined}
      className={`inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-4 text-xs font-semibold whitespace-nowrap transition-colors sm:h-8 ${
        active ? "border-amber-400 bg-amber-100 text-gray-900" : "border-gray-200 bg-white text-gray-700 hover:border-amber-400 hover:text-gray-900"
      }`}
    >
      {active && <CheckIcon size={12} />}
      {children}
    </Link>
  );
}

/** pagination: Previous / "Page x of y" / Next. Hidden when everything fits on one page. */
export function Pagination({ page, totalPages, hrefFor }: { page: number; totalPages: number; hrefFor: (page: number) => string }) {
  if (totalPages <= 1) return null;
  const step = "inline-flex h-11 items-center gap-1 rounded border px-4 text-xs font-bold sm:h-9";
  const prev = page > 1;
  const next = page < totalPages;
  return (
    <nav aria-label="Pagination" className="mt-6 flex items-center justify-center gap-3">
      {prev ? (
        <Link href={hrefFor(page - 1)} rel="prev" className={`${step} border-gray-200 bg-white text-gray-900 hover:bg-gray-50`}>
          <ChevronLeftIcon size={14} /> Previous
        </Link>
      ) : (
        <span aria-disabled="true" className={`${step} border-gray-200 bg-gray-50 text-gray-500`}>
          <ChevronLeftIcon size={14} /> Previous
        </span>
      )}
      <p className="text-xs text-gray-600" aria-current="page">
        Page <b className="text-gray-900">{page}</b> of {totalPages}
      </p>
      {next ? (
        <Link href={hrefFor(page + 1)} rel="next" className={`${step} border-gray-200 bg-white text-gray-900 hover:bg-gray-50`}>
          Next <ChevronRightIcon size={14} />
        </Link>
      ) : (
        <span aria-disabled="true" className={`${step} border-gray-200 bg-gray-50 text-gray-500`}>
          Next <ChevronRightIcon size={14} />
        </span>
      )}
    </nav>
  );
}

/** search-empty: says what found nothing and offers a way out, instead of a blank grid. */
export function SearchEmpty({ query, clearHref }: { query?: string; clearHref?: string }) {
  return (
    <div className="flex flex-col items-center rounded-md bg-white px-6 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500">
        <SearchIcon size={20} />
      </span>
      <h2 className="mt-4 text-lg font-bold text-gray-900">{query ? `No products match “${query}”` : "No products here yet"}</h2>
      <p className="mt-1 max-w-sm text-sm text-gray-600">
        {clearHref ? "Try removing a filter, or " : "Check the spelling, try fewer words, or "}browse everything we sell.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {clearHref && (
          <Button variant="ghost" href={clearHref}>
            Clear filters
          </Button>
        )}
        <Button href="/search">Browse all products</Button>
      </div>
    </div>
  );
}
