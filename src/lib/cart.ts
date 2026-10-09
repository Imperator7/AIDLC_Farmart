import type { Product } from "@/data/home";

export type CartItem = { product: Product; qty: number };

/** The most of one product a cart holds; the same limit as `qty` in openapi.yaml's cart operations. */
export const MAX_QTY = 99;

/** A quantity the cart can hold: a whole number from 1 to MAX_QTY. */
export const clampQty = (qty: number) => Math.min(MAX_QTY, Math.max(1, Math.trunc(qty)));

const isPrice = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0;

/**
 * The cart saved in localStorage, made safe to use. Anyone can edit that value, and it once turned a cart into
 * "051.5 items": a quantity of "5" was added as text and 1.5 was kept. Lines with a quantity that isn't a whole
 * number of at least 1, or a product without an id or a valid price, are dropped; quantities above MAX_QTY are
 * capped; a product listed twice keeps its first line.
 *
 * Prices still come from the browser here, so they can be edited. That is harmless while the cart only shows
 * totals; checkout must price the order on the server (openapi.yaml: "clients never send prices").
 */
export function sanitizeCart(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const items: CartItem[] = [];
  for (const line of raw) {
    const product = line?.product;
    const qty = line?.qty;
    if (typeof product?.id !== "string" || !product.id || seen.has(product.id)) continue;
    if (!Number.isInteger(qty) || qty < 1) continue;
    if (!isPrice(product.price) || (product.oldPrice != null && !isPrice(product.oldPrice))) continue;
    seen.add(product.id);
    items.push({ product, qty: clampQty(qty) });
  }
  return items;
}
