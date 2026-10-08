"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "./cart-context";
import SearchBar from "./search-bar";
import { CountBadge } from "./ui";

/** The Farmart mark and wordmark, linking home. Shared with the error page, which can't render the full header. */
export function BrandLogo() {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-400">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#101828" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M5 9h14l-1.5 10a2 2 0 0 1-2 1.7H8.5a2 2 0 0 1-2-1.7L5 9Z" />
          <path d="M9 9V7a3 3 0 0 1 6 0v2" />
          <path d="M12 3.5c1-1.5 3-2 4.5-1.5-.5 1.5-2 2.5-4.5 1.5Z" fill="#007A55" stroke="#007A55" />
        </svg>
      </span>
      <span className="leading-none">
        <span className="block text-xl font-bold text-gray-900">Farmart</span>
        <span className="text-[10px] tracking-widest text-gray-500 uppercase">Grocery</span>
      </span>
    </Link>
  );
}

const chevron = (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-gray-500">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const historyIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
    <path d="M3 3v5h5M12 7v5l3 2" />
  </svg>
);

const navLinks = [
  {
    label: "Deals Today",
    menu: false,
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="#FE9A00">
        <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
      </svg>
    ),
  },
  {
    label: "Special Prices",
    menu: false,
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E7000B" strokeWidth="2.2" strokeLinecap="round">
        <path d="M19 5 5 19" />
        <circle cx="7" cy="7" r="2.5" />
        <circle cx="17" cy="17" r="2.5" />
      </svg>
    ),
  },
  { label: "Fresh", menu: true, icon: null },
  { label: "Frozen", menu: true, icon: null },
  { label: "Bakery", menu: true, icon: null },
  { label: "Drinks", menu: true, icon: null },
  { label: "Blog", menu: false, icon: null },
];

type HeaderProps = {
  /** Options for the search category select (SiteHeader reads them from the catalog). */
  categories?: { slug: string; name: string }[];
  /** The current search, so the results page shows what was searched. */
  query?: string;
  category?: string;
};

export default function Header({ categories = [], query = "", category = "" }: HeaderProps) {
  const { count, total, setOpen } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-4">
        <BrandLogo />

        <SearchBar
          key={`d|${query}|${category}`}
          variant="desktop"
          categories={categories}
          defaultQuery={query}
          defaultCategory={category}
          className="hidden flex-1 md:flex"
        />

        <div className="ml-auto hidden text-right lg:block">
          <p className="text-lg font-bold text-gray-900">8 800 332 65-66</p>
          <p className="text-xs text-gray-500">Support 24/7</p>
        </div>

        <div className="flex items-center gap-5 text-gray-700">
          <button type="button" aria-label="Account" className="-m-2.5 p-2.5 hover:text-amber-700">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
            </svg>
          </button>
          <button type="button" aria-label="Wishlist" className="relative -m-2.5 p-2.5 hover:text-amber-700">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M12 21s-7-4.4-9.3-9C1 8.4 3.3 4 7.3 4c2 0 3.6 1.2 4.7 2.8C13.1 5.2 14.7 4 16.7 4c4 0 6.3 4.4 4.6 8-2.3 4.6-9.3 9-9.3 9Z" />
            </svg>
            <CountBadge count={0} className="absolute top-1 right-0.5" />
          </button>
          <button
            type="button"
            aria-label={`Your Cart, ${count} ${count === 1 ? "item" : "items"}, $${total.toFixed(2)}`}
            onClick={() => setOpen(true)} className="-m-2.5 flex items-center gap-2 p-2.5 hover:text-amber-700">
            <span className="relative">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M6 6h15l-1.5 9h-12L5 3H2" />
                <circle cx="9" cy="20" r="1.5" />
                <circle cx="18" cy="20" r="1.5" />
              </svg>
              <CountBadge count={count} className="absolute -top-1.5 -right-2" />
            </span>
            <span className="hidden text-left leading-tight sm:block">
              <span className="block text-[10px] text-gray-500">Your Cart</span>
              <span className="text-sm font-bold text-gray-900">${total.toFixed(2)}</span>
            </span>
          </button>
        </div>
      </div>

      {/* search-bar on phones: its own full-width row (no category select), so search is never missing. */}
      <SearchBar key={`m|${query}|${category}`} variant="mobile" defaultQuery={query} defaultCategory={category} className="mx-4 mb-3 flex md:hidden" />

      <nav className="relative border-t border-gray-100">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2 text-[13px] font-semibold text-gray-800">
          <button type="button" className="flex shrink-0 items-center gap-2 rounded bg-amber-400 px-4 py-2 text-xs font-bold hover:bg-amber-500">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            SHOP BY CATEGORY
          </button>

          <ul className="ml-4 hidden items-center gap-1 lg:flex">
            {navLinks.map((l) => (
              <li key={l.label}>
                <a href="#" className="flex items-center gap-1.5 rounded px-2.5 py-2 whitespace-nowrap hover:bg-gray-50 hover:text-amber-700">
                  {l.icon}
                  {l.label}
                  {l.menu && chevron}
                </a>
              </li>
            ))}
          </ul>

          <a href="#" className="ml-auto hidden items-center gap-1.5 whitespace-nowrap text-gray-600 hover:text-amber-700 lg:flex">
            {historyIcon}
            Recently Viewed
          </a>

          <button
            type="button"
            aria-expanded={menuOpen}
            aria-label="Toggle menu"
            onClick={() => setMenuOpen((o) => !o)}
            className="ml-auto flex items-center gap-1.5 rounded px-3 py-2 text-xs font-bold hover:bg-gray-50 lg:hidden"
          >
            MENU
            <span className={`transition-transform motion-reduce:transition-none ${menuOpen ? "rotate-180" : ""}`}>{chevron}</span>
          </button>
        </div>

        {/* Below lg the links collapse into a dropdown panel instead of a scrolling row. */}
        {menuOpen && (
          <ul className="absolute inset-x-0 top-full z-40 border-t border-gray-100 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-lg lg:hidden">
            {[...navLinks, { label: "Recently Viewed", icon: historyIcon, menu: false }].map((l) => (
              <li key={l.label}>
                <a href="#" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 border-b border-gray-50 py-3 hover:text-amber-700">
                  {l.icon}
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        )}
      </nav>
    </header>
  );
}
