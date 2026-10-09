"use client";

import { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import type { Product } from "@/data/home";
import { DELIVERY_FEE, FREE_DELIVERY_FROM } from "@/data/store";
import { type CartItem, clampQty, sanitizeCart } from "@/lib/cart";

export { DELIVERY_FEE, FREE_DELIVERY_FROM };
export type { CartItem };

/** The product the cart-toast confirms; `key` changes on every add so repeat adds re-show it. */
export type Added = { product: Product; key: number };

type State = { items: CartItem[]; open: boolean; loaded: boolean; added: Added | null };

type Action =
  | { type: "load"; items: CartItem[] }
  | { type: "add"; product: Product; qty: number }
  | { type: "setQty"; id: string; qty: number }
  | { type: "remove"; id: string }
  | { type: "clear" }
  | { type: "open"; open: boolean }
  | { type: "dismissAdded" };

const STORAGE_KEY = "farmart-cart";

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "load":
      return { ...state, items: action.items, loaded: true };
    case "add": {
      const existing = state.items.find((i) => i.product.id === action.product.id);
      const items = existing
        ? state.items.map((i) => (i === existing ? { ...i, qty: clampQty(i.qty + action.qty) } : i))
        : [...state.items, { product: action.product, qty: clampQty(action.qty) }];
      return { ...state, items, added: { product: action.product, key: (state.added?.key ?? 0) + 1 } };
    }
    case "setQty":
      return {
        ...state,
        items: state.items.map((i) => (i.product.id === action.id ? { ...i, qty: clampQty(action.qty) } : i)),
      };
    case "remove":
      return { ...state, items: state.items.filter((i) => i.product.id !== action.id) };
    case "clear":
      return { ...state, items: [] };
    case "open":
      // Opening the drawer answers the toast, so it goes away.
      return { ...state, open: action.open, added: action.open ? null : state.added };
    case "dismissAdded":
      return { ...state, added: null };
  }
}

function readStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? sanitizeCart(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
}

function useCartState() {
  const [state, dispatch] = useReducer(reducer, { items: [], open: false, loaded: false, added: null });

  // Restore the saved cart after hydration (localStorage doesn't exist on the server).
  useEffect(() => {
    dispatch({ type: "load", items: readStorage() });
  }, []);

  useEffect(() => {
    if (!state.loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
    } catch {
      // Storage full or blocked: the cart still works for this visit.
    }
  }, [state.items, state.loaded]);

  const count = state.items.reduce((n, i) => n + i.qty, 0);
  const subtotal = state.items.reduce((s, i) => s + i.qty * (i.product.oldPrice ?? i.product.price), 0);
  const total = state.items.reduce((s, i) => s + i.qty * i.product.price, 0);
  const delivery = count === 0 || total >= FREE_DELIVERY_FROM ? 0 : DELIVERY_FEE;

  // Stable references so effects that depend on them don't re-run every render.
  const actions = useMemo(
    () => ({
      add: (product: Product, qty = 1) => dispatch({ type: "add", product, qty }),
      setQty: (id: string, qty: number) => dispatch({ type: "setQty", id, qty }),
      remove: (id: string) => dispatch({ type: "remove", id }),
      clear: () => dispatch({ type: "clear" }),
      setOpen: (open: boolean) => dispatch({ type: "open", open }),
      dismissAdded: () => dispatch({ type: "dismissAdded" }),
    }),
    [],
  );

  return {
    items: state.items,
    isOpen: state.open,
    added: state.added,
    count,
    subtotal,
    savings: subtotal - total,
    total,
    delivery,
    grandTotal: total + delivery,
    ...actions,
  };
}

type Cart = ReturnType<typeof useCartState>;

const CartContext = createContext<Cart | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const cart = useCartState();
  return <CartContext.Provider value={cart}>{children}</CartContext.Provider>;
}

export function useCart() {
  const cart = useContext(CartContext);
  if (!cart) throw new Error("useCart must be used inside CartProvider");
  return cart;
}
