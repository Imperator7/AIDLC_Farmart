"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import type { SearchSuggestions } from "@/data/home";
import { searchHref, suggestionOptions, type SearchOption } from "@/lib/search";
import { GridIcon, SearchIcon } from "./icons";

/** Bolds the first place the query appears, so the shopper sees why a row matched. */
function Highlight({ text, query }: { text: string; query: string }) {
  const at = text.toLowerCase().indexOf(query.trim().toLowerCase().split(/\s+/)[0] ?? "");
  if (!query.trim() || at < 0) return <>{text}</>;
  const end = at + query.trim().split(/\s+/)[0].length;
  return (
    <>
      {text.slice(0, at)}
      <b className="font-bold text-gray-900">{text.slice(at, end)}</b>
      {text.slice(end)}
    </>
  );
}

/**
 * search-suggestions (DESIGN.md): the dropdown under the search bar. Presentational, so /design
 * and Storybook can show it without the API.
 */
export function SuggestionsPanel({
  id,
  query,
  options,
  activeIndex = -1,
  onPick,
  onHover,
}: {
  id: string;
  query: string;
  options: SearchOption[];
  activeIndex?: number;
  onPick?: (option: SearchOption) => void;
  onHover?: (index: number) => void;
}) {
  const row = (i: number) =>
    `flex min-h-11 cursor-pointer items-center gap-3 px-4 py-1.5 text-sm text-gray-700 ${i === activeIndex ? "bg-amber-100" : ""}`;
  const groups = [
    { label: "Products", kind: "product" },
    { label: "Categories", kind: "category" },
    { label: null, kind: "search" },
  ] as const;

  return (
    <div className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-md bg-white py-2 text-left shadow-lg">
      {options.length === 0 ? (
        <p className="px-4 py-3 text-sm text-gray-600">
          No products match “<span className="font-semibold text-gray-900">{query.trim()}</span>”.
        </p>
      ) : (
        <ul id={id} role="listbox" aria-label="Search suggestions">
          {groups.map((g) => {
            const items = options.map((o, i) => ({ o, i })).filter(({ o }) => o.kind === g.kind);
            if (!items.length) return null;
            return (
              <li key={g.kind} role="presentation" className={g.kind === "search" ? "mt-1 border-t border-gray-100 pt-1" : ""}>
                {g.label && (
                  <p aria-hidden className="px-4 pt-2 pb-1 text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
                    {g.label}
                  </p>
                )}
                <ul role="group" aria-label={g.label ?? "Search"}>
                  {items.map(({ o, i }) => (
                    <li
                      key={o.key}
                      id={`${id}-${i}`}
                      role="option"
                      aria-selected={i === activeIndex}
                      className={row(i)}
                      // Keep focus in the input so the click doesn't blur and close the panel first.
                      onMouseDown={(e) => e.preventDefault()}
                      onMouseEnter={() => onHover?.(i)}
                      onClick={() => onPick?.(o)}
                    >
                      {o.kind === "product" && (
                        <>
                          <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-sm bg-gray-100">
                            <Image src={o.image} alt="" fill sizes="40px" className="object-cover" />
                          </span>
                          <span className="min-w-0 flex-1 truncate">
                            <Highlight text={o.name} query={query} />
                          </span>
                          <span className="shrink-0 font-semibold text-gray-900">${o.price.toFixed(2)}</span>
                        </>
                      )}
                      {o.kind === "category" && (
                        <>
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-gray-100 text-gray-500">
                            <GridIcon size={16} />
                          </span>
                          <span className="min-w-0 flex-1 truncate">
                            <Highlight text={o.name} query={query} />
                          </span>
                          <span className="shrink-0 text-xs text-gray-500">Category</span>
                        </>
                      )}
                      {o.kind === "search" && (
                        <>
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center text-gray-500">
                            <SearchIcon size={16} />
                          </span>
                          <span className="min-w-0 flex-1 truncate">
                            Search for “<span className="font-semibold text-gray-900">{o.query}</span>”
                          </span>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

type SearchBarProps = {
  /** "desktop" shows the category select; "mobile" is the full-width row under the logo bar. */
  variant: "desktop" | "mobile";
  categories?: { slug: string; name: string }[];
  defaultQuery?: string;
  defaultCategory?: string;
  className?: string;
};

/**
 * search-bar (DESIGN.md): submits to /search and suggests products and categories as you type
 * (GET /api/search/suggestions). Works as a plain GET form without JavaScript.
 */
export default function SearchBar({ variant, categories = [], defaultQuery = "", defaultCategory = "", className = "" }: SearchBarProps) {
  const router = useRouter();
  const listId = useId();
  const desktop = variant === "desktop";
  const [query, setQuery] = useState(defaultQuery);
  const [category, setCategory] = useState(defaultCategory);
  const [data, setData] = useState<SearchSuggestions | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const wrapper = useRef<HTMLFormElement>(null);

  // Debounced fetch; each keystroke cancels the previous request so late answers never overwrite newer ones.
  useEffect(() => {
    const q = query.trim();
    if (!q) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggestions?${new URLSearchParams({ q, limit: "5" })}`, { signal: controller.signal });
        if (!res.ok) throw new Error(String(res.status));
        setData((await res.json()) as SearchSuggestions);
        setActive(-1);
      } catch {
        // Aborted or offline: keep the last suggestions; submitting still runs the full search.
      }
    }, 150);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const shown = query.trim() && data ? data : null;
  const options = shown ? suggestionOptions(shown, desktop ? category : undefined) : [];
  const expanded = open && !!shown;

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
    } else if ((e.key === "ArrowDown" || e.key === "ArrowUp") && options.length) {
      e.preventDefault();
      setOpen(true);
      // Cycles through the options and back to the input (-1), like a native datalist.
      const next = active + (e.key === "ArrowDown" ? 1 : -1);
      setActive(next >= options.length ? -1 : next < -1 ? options.length - 1 : next);
    } else if (e.key === "Enter" && expanded && active >= 0 && options[active]) {
      e.preventDefault();
      go(options[active].href);
    }
  };


  return (
    <form
      ref={wrapper}
      action="/search"
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        // The mobile bar has no category select, so it always searches everything rather than a hidden filter.
        go(searchHref({ q: query, category: desktop ? category : undefined }));
      }}
      onBlur={(e) => {
        if (!wrapper.current?.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
      className={`relative items-center rounded-md bg-gray-100 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-gray-900 ${className}`}
    >
      {desktop && (
        <>
          <select
            name="category"
            aria-label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="max-w-40 bg-transparent py-2.5 pl-3 text-xs font-semibold text-gray-700 uppercase outline-none"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
          <span className="mx-3 h-5 w-px bg-gray-300" />
        </>
      )}
      <input
        type="search"
        name="q"
        role="combobox"
        aria-label="Search products"
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls={expanded && options.length ? listId : undefined}
        aria-activedescendant={expanded && active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        maxLength={100}
        placeholder="I'm searching for..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        className={`min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none placeholder:text-gray-600 ${desktop ? "" : "pl-4"}`}
      />
      <button type="submit" aria-label="Search" className={`self-stretch px-4 text-gray-500 hover:text-gray-900 ${desktop ? "" : "py-2.5"}`}>
        <SearchIcon size={16} />
      </button>
      <p className="sr-only" aria-live="polite">
        {expanded ? (options.length ? `${options.length} suggestions. Use the up and down arrows to choose.` : "No matching products.") : ""}
      </p>
      {expanded && <SuggestionsPanel id={listId} query={query} options={options} activeIndex={active} onPick={(o) => go(o.href)} onHover={setActive} />}
    </form>
  );
}
