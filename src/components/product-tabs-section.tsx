"use client";

import { useState } from "react";
import { featuredId, sectionTabs, type Product } from "@/data/home";
import { Arrows } from "./home-sections";
import ProductCard from "./product-card";

/** Section with category tabs; the biggest saving among the shown products is the featured card. */
export default function ProductTabsSection({ title, products }: { title: string; products: Product[] }) {
  const [tab, setTab] = useState("All");
  const shown = tab === "All" ? products : products.filter((p) => p.category === tab);
  const featured = featuredId(shown);

  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      {/* Mobile: title + arrows on one row, tabs scroll below. Desktop: one row. */}
      <div className="mb-5 grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-2 lg:flex">
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        <div
          role="group"
          aria-label={`Filter ${title}`}
          className="col-span-2 row-start-2 -mx-4 flex gap-5 overflow-x-auto px-4 py-1 text-xs [scrollbar-width:none] lg:mx-0 lg:overflow-visible lg:px-0"
        >
          {sectionTabs.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={tab === t}
              onClick={() => setTab(t)}
              className={`shrink-0 border-b-2 py-1.5 whitespace-nowrap transition-colors ${
                tab === t ? "border-amber-400 font-bold text-gray-900" : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <Arrows />
      </div>

      {shown.length === 0 ? (
        <p className="rounded bg-white py-16 text-center text-sm text-gray-500">No products in this category yet.</p>
      ) : (
        // No grid background: the 1px gaps show the gray floor as plate edges, and a short row leaves floor, not a white slab.
        <div className="grid grid-cols-2 gap-px sm:grid-cols-3 lg:grid-cols-6">
          {shown.map((p) => (
            <ProductCard key={p.id} p={p} featured={p.id === featured} />
          ))}
        </div>
      )}
    </section>
  );
}
