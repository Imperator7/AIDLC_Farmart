/**
 * Product-detail components (DESIGN.md: breadcrumb, price-block, stock-badge,
 * benefit-list, accordion). Server-safe: no hooks, no client state.
 */
import Link from "next/link";
import { discountPercent, type Product } from "@/data/home";
import { DiscountBadge } from "./ui";

/** breadcrumb */
export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex min-w-0 items-center gap-1.5 text-xs text-gray-500">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={i} className={`flex items-center gap-1.5 ${last ? "min-w-0" : "shrink-0"}`}>
              {item.href && !last ? (
                <Link href={item.href} className="hover:text-amber-700">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={last ? "page" : undefined} className={last ? "truncate font-semibold text-gray-900" : ""}>
                  {item.label}
                </span>
              )}
              {!last && <span className="text-gray-300">›</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** price-block */
export function PriceBlock({ p }: { p: Product }) {
  const off = discountPercent(p);
  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-3">
        <span className={`text-3xl font-bold ${p.oldPrice ? "text-red-600" : "text-gray-900"}`}>${p.price.toFixed(2)}</span>
        {p.oldPrice && <span className="text-lg text-gray-500 line-through">${p.oldPrice.toFixed(2)}</span>}
        {off > 0 && <DiscountBadge percent={off} className="self-center" />}
      </div>
      {p.oldPrice && <p className="mt-1 text-sm font-semibold text-red-600">You save ${(p.oldPrice - p.price).toFixed(2)}</p>}
      <p className="mt-1 text-[11px] text-gray-500">per {p.unit}</p>
    </div>
  );
}

/** stock-badge: low stock (≤ 20 left) is urgent amber, never sale red. */
export function StockBadge({ left }: { left?: number }) {
  const low = left !== undefined && left <= 20;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        low ? "bg-amber-400/15 text-amber-700" : "bg-emerald-600/10 text-emerald-700"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${low ? "bg-amber-500" : "bg-emerald-500"}`} />
      {low ? `Only ${left} left` : "In stock"}
    </span>
  );
}

/** tag: neutral product fact. */
export function Tag({ children }: { children: React.ReactNode }) {
  return <span className="inline-block rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">{children}</span>;
}

const icon = (d: string) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-emerald-700">
    <path d={d} />
  </svg>
);

export const benefitIcons = {
  truck: icon("M3 6h11v9H3zM14 9h4l3 3v3h-7M7 18.5a1.5 1.5 0 1 0 0-.01M17 18.5a1.5 1.5 0 1 0 0-.01"),
  leaf: icon("M5 19c0-8 6-14 15-14 0 9-6 15-14 15M5 19l7-7"),
  refresh: icon("M3 12a9 9 0 0 1 15.5-6.2L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.5 6.2L3 16M3 21v-5h5"),
};

/** benefit-list: keep to 3 rows. */
export function BenefitList({ items }: { items: { icon: React.ReactNode; text: React.ReactNode }[] }) {
  return (
    <ul className="divide-y divide-gray-100 rounded-md border border-gray-200">
      {items.map((b, i) => (
        <li key={i} className="flex items-center gap-3 px-4 py-3 text-xs text-gray-700">
          {b.icon}
          <span>{b.text}</span>
        </li>
      ))}
    </ul>
  );
}

/** accordion: native <details>, so it works without JS and with the keyboard. */
export function Accordion({ items }: { items: { title: string; content: React.ReactNode; open?: boolean }[] }) {
  return (
    <div className="divide-y divide-gray-200 border-y border-gray-200">
      {items.map((item) => (
        <details key={item.title} open={item.open} className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between py-4 text-sm font-semibold text-gray-900 hover:text-amber-700 [&::-webkit-details-marker]:hidden">
            {item.title}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-gray-500 transition-transform group-open:rotate-180">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </summary>
          <div className="pb-4 text-sm leading-relaxed text-gray-700">{item.content}</div>
        </details>
      ))}
    </div>
  );
}
