"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { FREE_DELIVERY_FROM, useCart } from "./cart-context";
import Dialog from "./dialog";
import { CheckIcon, CloseIcon } from "./icons";
import { QtyPill } from "./product-card";
import { Button } from "./ui";

const money = (n: number) => `$${n.toFixed(2)}`;
const items = (n: number) => `${n} ${n === 1 ? "item" : "items"}`;

export default function CartDrawer() {
  const cart = useCart();
  const { isOpen, setOpen } = cart;
  const [confirmClear, setConfirmClear] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Overlay contract (DESIGN.md › Overlays): Escape closes, page doesn't scroll, the rest of the
  // page is inert (so Tab stays inside), focus moves in on open and returns to the trigger on close.
  useEffect(() => {
    if (!isOpen) return;
    const trigger = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    // A modal dialog on top (e.g. "Clear your cart?") owns Escape; only close the drawer when none is open.
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !document.querySelector("dialog:modal") && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    // Mark every sibling on the path from the drawer up to <body> inert; restore exactly those on close.
    const inerted: HTMLElement[] = [];
    for (let el: HTMLElement | null = rootRef.current; el && el !== document.body; el = el.parentElement) {
      for (const sib of Array.from(el.parentElement?.children ?? [])) {
        if (sib !== el && sib instanceof HTMLElement && !sib.inert) {
          sib.inert = true;
          inerted.push(sib);
        }
      }
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      inerted.forEach((el) => (el.inert = false));
      trigger?.focus();
    };
  }, [isOpen, setOpen]);

  const toFree = FREE_DELIVERY_FROM - cart.total;

  return (
    <div ref={rootRef} className={`fixed inset-0 z-50 ${isOpen ? "" : "pointer-events-none"}`} inert={!isOpen}>
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity ${isOpen ? "opacity-100" : "opacity-0"}`}
        onClick={() => setOpen(false)}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
        // The shadow only while open: off-screen (translate-x-full) it still spread onto the page's right edge,
        // a grey band on every page that the E2E image tests caught.
        className={`absolute top-0 right-0 flex h-full w-full max-w-md flex-col bg-white transition-transform duration-300 motion-reduce:transition-none ${
          isOpen ? "translate-x-0 shadow-2xl" : "translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 id="cart-drawer-title" className="text-base font-bold text-gray-900">
            Your Cart <span className="font-normal text-gray-500">({items(cart.count)})</span>
          </h2>
          <button ref={closeRef} type="button" aria-label="Close cart" onClick={() => setOpen(false)} className="-m-2 rounded p-2 text-gray-500 hover:text-gray-900">
            <CloseIcon size={20} />
          </button>
        </header>

        {cart.items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.3">
              <path d="M6 6h15l-1.5 9h-12L5 3H2" />
              <circle cx="9" cy="20" r="1.5" />
              <circle cx="18" cy="20" r="1.5" />
            </svg>
            <p className="font-semibold text-gray-900">Your cart is empty</p>
            <p className="text-sm text-gray-500">Browse our fresh deals and add something you like.</p>
            <Button onClick={() => setOpen(false)} className="mt-2">
              Continue Shopping
            </Button>
          </div>
        ) : (
          <>
            <div className="border-b border-gray-100 px-5 py-3 text-xs">
              {toFree > 0 ? (
                <p className="text-gray-600">
                  Add <b className="text-gray-900">{money(toFree)}</b> more for <b className="text-emerald-700">FREE delivery</b>
                </p>
              ) : (
                <p className="flex items-center gap-1 font-semibold text-emerald-700">
                  <CheckIcon size={14} />
                  You&apos;ve unlocked FREE delivery
                </p>
              )}
              <div className="mt-2 h-1.5 rounded-full bg-gray-100">
                <div
                  className="h-1.5 rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${Math.min(100, (cart.total / FREE_DELIVERY_FROM) * 100)}%` }}
                />
              </div>
            </div>

            <ul className="flex-1 divide-y divide-gray-100 overflow-y-auto px-5">
              {cart.items.map(({ product: p, qty }) => (
                <li key={p.id} className="flex gap-3 py-4">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-gray-50">
                    <Image src={p.image} alt={p.name} fill sizes="80px" className="object-cover" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex justify-between gap-2">
                      <div className="min-w-0">
                        <p className="line-clamp-2 text-sm font-semibold text-gray-900">{p.name}</p>
                        <p className="text-xs text-gray-500">
                          {p.brand} · {p.unit}
                        </p>
                      </div>
                    </div>
                    <div className="mt-auto flex items-end justify-between pt-2">
                      {/* Same compact stepper as the product cards, so quantity works the same everywhere. */}
                      <div className="w-28">
                        <QtyPill name={p.name} qty={qty} onChange={(n) => (n < 1 ? cart.remove(p.id) : cart.setQty(p.id, n))} />
                      </div>
                      <div className="text-right">
                        {p.oldPrice && <p className="text-xs text-gray-500 line-through">{money(p.oldPrice * qty)}</p>}
                        <p className="text-sm font-bold text-gray-900">{money(p.price * qty)}</p>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <footer className="border-t border-gray-200 bg-gray-50 px-5 py-4 text-sm">
              <dl className="space-y-1.5">
                <div className="flex justify-between text-gray-600">
                  <dt>Subtotal</dt>
                  <dd>{money(cart.subtotal)}</dd>
                </div>
                {cart.savings > 0 && (
                  <div className="flex justify-between text-red-600">
                    <dt>Product discounts</dt>
                    <dd>−{money(cart.savings)}</dd>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <dt>Delivery</dt>
                  <dd>{cart.delivery === 0 ? <span className="font-semibold text-emerald-700">FREE</span> : money(cart.delivery)}</dd>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold text-gray-900">
                  <dt>Total</dt>
                  <dd>{money(cart.grandTotal)}</dd>
                </div>
              </dl>
              <Button size="lg" className="mt-4 w-full">
                Checkout
              </Button>
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="mt-2 w-full py-1 text-xs text-gray-500 hover:text-red-600"
              >
                Clear cart
              </button>
              <Dialog
                open={confirmClear}
                onClose={() => setConfirmClear(false)}
                title="Clear your cart?"
                tone="danger"
                confirmLabel="Clear cart"
                onConfirm={cart.clear}
              >
                All {items(cart.count)} will be removed. This can&apos;t be undone.
              </Dialog>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
