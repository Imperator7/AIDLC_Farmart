"use client";

import Image from "next/image";
import Link from "next/link";
import { discountPercent, type Product } from "@/data/home";
import { useCart } from "./cart-context";
import { MinusIcon, PlusIcon, StarIcon } from "./icons";
import { DiscountBadge } from "./ui";

export function Stars({ rating, reviews }: { rating: number; reviews: number }) {
  return (
    <div className="flex items-center gap-1 text-[11px]">
      <span className="flex" role="img" aria-label={`Rated ${rating} out of 5`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <StarIcon key={i} size={11} className={i <= rating ? "text-amber-500" : "text-gray-300"} />
        ))}
      </span>
      <span className="text-gray-500">({reviews})</span>
    </div>
  );
}

export function Price({ p }: { p: Product }) {
  return (
    <p className="text-sm font-bold">
      <span className={p.oldPrice ? "text-red-600" : "text-gray-900"}>${p.price.toFixed(2)}</span>
      {p.oldPrice && <span className="ml-1.5 text-xs font-normal text-gray-500 line-through">${p.oldPrice.toFixed(2)}</span>}
    </p>
  );
}

export function SoldBar({ sold, stock }: { sold: number; stock: number }) {
  return (
    <div className="mt-2">
      <div className="h-1 rounded-full bg-gray-200">
        <div className="h-1 rounded-full bg-amber-400" style={{ width: `${(sold / stock) * 100}%` }} />
      </div>
      <p className="mt-1 text-[11px] text-gray-500">
        Sold: {sold}/{stock}
      </p>
    </div>
  );
}

const trashIcon = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
  </svg>
);

type PillSize = "md" | "lg";

/** add-button / add-button-lg (DESIGN.md): resting state of the cart control. */
export function AddPill({ name, onAdd, size = "md" }: { name: string; onAdd: () => void; size?: PillSize }) {
  return (
    <button
      type="button"
      onClick={onAdd}
      aria-label={`Add ${name} to cart`}
      className={`flex w-full items-center justify-center gap-1 rounded-full border-2 border-amber-400 bg-amber-100 font-bold text-gray-900 transition-colors hover:bg-amber-400 ${
        size === "lg" ? "h-12 text-sm" : "h-8 text-xs"
      }`}
    >
      <PlusIcon size={size === "lg" ? 16 : 12} strokeWidth={2.5} /> {size === "lg" ? "Add to cart" : "Add"}
    </button>
  );
}

/** qty-stepper / qty-stepper-lg (DESIGN.md): − qty + pill; at 1 the − becomes a trash icon. */
export function QtyPill({ name, qty, onChange, size = "md" }: { name: string; qty: number; onChange: (qty: number) => void; size?: PillSize }) {
  const lg = size === "lg";
  const btn = `flex items-center justify-center rounded-full transition-colors hover:bg-amber-500 ${lg ? "h-12 w-12" : "h-8 w-8"}`;
  return (
    <div className={`flex w-full items-center justify-between rounded-full bg-amber-400 text-gray-900 ${lg ? "h-12" : "h-8"}`}>
      <button
        type="button"
        aria-label={qty === 1 ? `Remove ${name} from cart` : `Decrease ${name}`}
        onClick={() => onChange(qty - 1)}
        className={btn}
      >
        {qty === 1 ? trashIcon : <MinusIcon size={lg ? 16 : 13} strokeWidth={2.5} />}
      </button>
      <span className={`font-bold tabular-nums ${lg ? "text-sm" : "text-xs"}`} aria-live="polite">
        {lg ? `${qty} in cart` : qty}
      </span>
      <button type="button" aria-label={`Increase ${name}`} onClick={() => onChange(qty + 1)} className={btn}>
        <PlusIcon size={lg ? 16 : 13} strokeWidth={2.5} />
      </button>
    </div>
  );
}

/** Add button that turns into the qty pill, bound to the cart once the product is in it. */
export function CartControl({ p, size = "md" }: { p: Product; size?: PillSize }) {
  const { add, setQty, remove, items } = useCart();
  const qty = items.find((i) => i.product.id === p.id)?.qty ?? 0;

  if (qty === 0) return <AddPill name={p.name} onAdd={() => add(p, 1)} size={size} />;
  return <QtyPill name={p.name} qty={qty} onChange={(n) => (n < 1 ? remove(p.id) : setQty(p.id, n))} size={size} />;
}

/** Product card. `featured` (the row's biggest saving, see featuredId) is lifted with one shadow. */
export default function ProductCard({ p, featured = false }: { p: Product; featured?: boolean }) {
  const off = discountPercent(p);

  return (
    <article
      className={`group relative flex flex-col bg-white p-4 transition-shadow ${
        featured ? "z-[1] rounded-md shadow-md" : "hover:shadow-lg"
      }`}
    >
      {off > 0 && <DiscountBadge percent={off} className="absolute top-3 left-3 z-10" />}

      <Link href={`/products/${p.id}`} className="relative mb-3 block aspect-square overflow-hidden rounded-md bg-gray-50">
        <Image
          src={p.image}
          alt={p.name}
          fill
          sizes="(min-width: 1024px) 180px, (min-width: 640px) 33vw, 50vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </Link>

      <p className="text-[11px] font-semibold text-gray-900">{p.brand}</p>
      <Link href={`/products/${p.id}`} className="line-clamp-2 min-h-8 text-xs text-sky-700 hover:underline">
        {p.name}
      </Link>
      <Stars rating={p.rating} reviews={p.reviews} />
      <p className="mb-1 text-[11px] text-gray-500">{p.unit}</p>
      <Price p={p} />
      {p.sold !== undefined && p.stock !== undefined && <SoldBar sold={p.sold} stock={p.stock} />}

      <div className="mt-auto pt-3">
        <CartControl p={p} />
      </div>
    </article>
  );
}