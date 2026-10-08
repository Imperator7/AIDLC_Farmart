"use client";

import { useEffect, useState } from "react";
import { FREE_DELIVERY_FROM } from "@/data/store";
import { useCart } from "./cart-context";
import { CheckIcon, CloseIcon } from "./icons";
import { Button } from "./ui";

const SHOW_MS = 4000;
const money = (n: number) => `$${n.toFixed(2)}`;

/**
 * cart-toast (DESIGN.md): confirms "+ Add" with the running total, because the header's
 * cart total scrolls away on a long page. Non-modal: no scrim, no focus grab.
 */
export default function CartToast() {
  const { added, total, isOpen, setOpen, dismissAdded } = useCart();
  const visible = added !== null && !isOpen;

  return (
    // The live region stays mounted so screen readers announce each new message.
    <div aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-4 z-40 flex justify-end sm:inset-x-auto sm:right-6 sm:bottom-6">
      {visible && (
        // Keyed per add: a fresh timer and pause state every time, even if the last toast closed mid-hover.
        <TimedToast key={added.key} onExpire={dismissAdded}>
          <CartToastCard name={added.product.name} total={total} onView={() => setOpen(true)} onDismiss={dismissAdded} />
        </TimedToast>
      )}
    </div>
  );
}

/** Calls onExpire after SHOW_MS, pausing while hovered or focused. */
function TimedToast({ onExpire, children }: { onExpire: () => void; children: React.ReactNode }) {
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setTimeout(onExpire, SHOW_MS);
    return () => clearTimeout(t);
  }, [paused, onExpire]);

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="pointer-events-auto w-full animate-[toast-in_200ms_ease-out] sm:w-[360px] motion-reduce:animate-[toast-fade_200ms_ease-out]"
    >
      {children}
    </div>
  );
}

/** The toast's card on its own (no timer, no cart), for the design system and stories. */
export function CartToastCard({ name, total, onView, onDismiss }: { name: string; total: number; onView?: () => void; onDismiss?: () => void }) {
  const toFree = FREE_DELIVERY_FROM - total;
  const check = (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-700/10 text-emerald-700">
      <CheckIcon size={12} />
    </span>
  );
  return (
    // One elevation (shadow only). The live region is the wrapper in CartToast, so no role here.
    <div className="rounded-md bg-white shadow-lg">
      {/* Phone: a single 56px line, so it doesn't cover the next row's Add buttons. */}
      <div className="flex h-14 items-center gap-3 px-4 sm:hidden">
        {check}
        <p className="min-w-0 flex-1 truncate text-sm text-gray-700">
          <b className="text-gray-900">Added</b>
          <span className="sr-only"> {name}</span> · Cart {money(total)}
        </p>
        <button type="button" onClick={onView} className="-my-2 shrink-0 py-2 text-sm font-bold text-amber-700 hover:text-gray-900">
          View cart
        </button>
      </div>

      <div className="hidden p-4 sm:block">
        <div className="flex items-start gap-3">
          <span className="mt-0.5">{check}</span>
          <div className="min-w-0 flex-1 text-xs text-gray-700">
            <p className="truncate text-sm font-semibold text-gray-900">Added {name}</p>
            <p className="mt-0.5">
              Cart total <b className="text-gray-900">{money(total)}</b>
              {" · "}
              {toFree > 0 ? (
                <>
                  {money(toFree)} more for <span className="font-semibold text-emerald-700">FREE delivery</span>
                </>
              ) : (
                <span className="font-semibold text-emerald-700">FREE delivery unlocked</span>
              )}
            </p>
          </div>
          <button type="button" aria-label="Dismiss" onClick={onDismiss} className="-m-1.5 rounded p-1.5 text-gray-500 hover:text-gray-900">
            <CloseIcon size={14} />
          </button>
        </div>
        <Button onClick={onView} className="mt-3 w-full">
          View cart
        </Button>
      </div>
    </div>
  );
}
