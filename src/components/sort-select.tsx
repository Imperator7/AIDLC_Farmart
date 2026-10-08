"use client";

import { useRouter } from "next/navigation";
import { useId } from "react";
import { searchHref } from "@/lib/search";

const options = [
  { value: "relevance", label: "Best match" },
  { value: "bestselling", label: "Best selling" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "rating_desc", label: "Top rated" },
  { value: "discount_desc", label: "Biggest saving" },
  { value: "newest", label: "Newest" },
];

/** sort-select (DESIGN.md): changing it reloads the results in the new order, back on page 1. */
export default function SortSelect({ value, params }: { value: string; params: Record<string, string | undefined> }) {
  const router = useRouter();
  const id = useId();
  // Without a query there is nothing to match, so "relevance" means best selling; don't offer both.
  const shown = params.q ? options : options.filter((o) => o.value !== "bestselling").map((o) => (o.value === "relevance" ? { ...o, label: "Best selling" } : o));

  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="text-xs text-gray-600">
        Sort by
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => router.push(searchHref({ ...params, sort: e.target.value === "relevance" ? undefined : e.target.value, page: undefined }), { scroll: false })}
        className="h-10 rounded-sm border border-gray-200 bg-white pr-2 pl-3 text-xs font-semibold text-gray-900 hover:border-amber-400 sm:h-9"
      >
        {shown.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
