import { DELIVERY_FEE, FREE_DELIVERY_FROM } from "@/data/store";
import { benefitIcons } from "./pdp";

/**
 * trust-strip (DESIGN.md): the store's promises in one row under the nav.
 * Only facts the store already states elsewhere (cart drawer, product page benefits).
 */
export function TrustStrip() {
  const items = [
    { icon: benefitIcons.truck, text: <>Free delivery on orders over <b className="font-semibold text-gray-900">${FREE_DELIVERY_FROM}</b></> },
    { icon: benefitIcons.leaf, text: "Freshness guaranteed or your money back" },
    { icon: benefitIcons.refresh, text: "Easy returns within 24 hours" },
  ];
  return (
    <section aria-label="Our promises" className="border-b border-gray-200 bg-white">
      <ul className="mx-auto flex max-w-6xl flex-wrap justify-center gap-x-8 gap-y-1.5 px-4 py-2.5 text-xs text-gray-700">
        {items.map((b, i) => (
          // Below 640px only the free-delivery promise shows, so the strip stays one line.
          <li key={i} className={`items-center gap-2 ${i === 0 ? "flex" : "hidden sm:flex"}`}>
            {b.icon}
            <span>{b.text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** site-footer (DESIGN.md): closes every store page. Plain text until help pages exist, so no dead links. */
export function SiteFooter() {
  return (
    <footer className="border-t border-gray-200 bg-white text-xs text-gray-500">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr]">
        <div>
          <p className="text-base font-bold text-gray-900">Farmart</p>
          <p className="mt-2 max-w-xs leading-relaxed">Fresh groceries, daily deals and fast delivery, picked and packed the day you order.</p>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Delivery</h2>
          <ul className="mt-3 space-y-2">
            <li>Free on orders over ${FREE_DELIVERY_FROM}</li>
            <li>${DELIVERY_FEE.toFixed(2)} on smaller orders</li>
            <li>Delivered chilled in insulated bags</li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Help</h2>
          <ul className="mt-3 space-y-2">
            <li>Support 24/7</li>
            <li className="font-semibold text-gray-900">8 800 332 65-66</li>
            <li>Refunds within 24 hours if anything isn&apos;t fresh</li>
          </ul>
        </div>
      </div>
      <p className="border-t border-gray-100 py-4 text-center">© {new Date().getFullYear()} Farmart</p>
    </footer>
  );
}
