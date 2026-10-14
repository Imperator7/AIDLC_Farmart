# State management: TanStack Query and Zustand

A guide to learn from and a proposal to discuss: how Farmart should manage state on the client once it has accounts,
checkout and an admin dashboard. Nothing here is built yet; the plan's phases build it (PLAN.md › Decisions).

## 1. The one idea: there are different kinds of state

Most state bugs come from treating every piece of data the same way. Sort each piece by **who owns it**:

| Kind | Owner | Examples in Farmart | Tool |
|---|---|---|---|
| **Server state** | The database. The browser only holds a copy, which can be out of date | products, the signed-in user, the checkout quote, my orders, admin tables | Server Components, or **TanStack Query** in client components |
| **Client state** | The browser, and nobody else | the cart (until checkout), is the cart drawer open, the "added to cart" toast | **Zustand** (or `useState` if only one component needs it) |
| **URL state** | The address bar: shareable, survives reload, back button works | search text, category, sort, page; admin filters (status, page) | `searchParams` (already used on `/search`) |
| **Form state** | One form, while it's being filled in | checkout address, login, product edit | the form itself (`useActionState` / `react-hook-form`), validated with zod |

The rules that follow from this:

1. **Never copy server state into a client store.** If the user's orders are in Zustand, you now own keeping them in
   sync with the database: caching, refetching, invalidation. That's exactly what TanStack Query already does.
2. **If it can go in the URL, put it in the URL.** Filters in Zustand are lost on reload and can't be shared.
3. **Start local.** `useState` in the component is fine until two distant components need the same value.

## 2. Server state

### First choice: Server Components (no library)

Pages that only show data (home, search, product page) fetch on the server, as today: the page calls `src/server/`
directly and sends HTML. No loading spinners, no client cache, no JavaScript for the data. **Keep this.** TanStack
Query is not a replacement for Server Components; it's for data that client components read and change.

### TanStack Query: when the browser reads or changes server data

Use it when a client component needs data that changes because of what the user does:

- the header's account menu (`GET /api/auth/me`), shared by many components;
- the checkout quote (`POST /api/checkout/quote`), re-asked whenever the cart or the coupon changes;
- my orders, an order's status while waiting for payment (poll every 10 s until `paid`);
- the whole admin dashboard: tables that change, edits, status changes.

What it gives you, which hand-written `useEffect` + `fetch` gets wrong:

| Feature | What it means |
|---|---|
| Cache by key | `["orders", { status: "paid" }]` is fetched once and shared by every component that asks |
| Dedupe | Ten components asking at once make one request |
| `staleTime` | How long data counts as fresh; fresh data is shown without a request |
| Background refetch | Stale data is shown immediately, then quietly refreshed (on focus, reconnect, interval) |
| Mutations + invalidation | After "mark as paid", invalidate `["admin", "orders"]` and every list showing it refreshes |
| Optimistic updates | Show the change before the server answers, roll back if it fails |
| States | `isPending`, `isError`, `error` without your own flags |

### Patterns we'll use (production practices)

**One `QueryClient` per browser session**, created inside a provider (never at module level on the server, where it
would be shared between users):

```tsx
"use client";
export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: true } },
  }));
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
```

**A query key factory**, so keys are never typed by hand twice and invalidation can target a whole group:

```ts
export const keys = {
  me: ["me"] as const,
  orders: {
    all: ["orders"] as const,
    list: (filters: { status?: OrderStatus; page: number }) => ["orders", "list", filters] as const,
    detail: (id: string) => ["orders", "detail", id] as const,
  },
  admin: { orders: (f: AdminOrderFilters) => ["admin", "orders", f] as const /* … */ },
};
```

**Query functions that understand our API errors.** Every Farmart error is a `Problem` (`code`, `detail`, `errors[]`);
one `apiFetch` helper throws a typed `ApiProblem`, so components can show "Only 2 left" from `OUT_OF_STOCK` instead of
"Something went wrong".

**Mutations invalidate what they change:**

```ts
const markPaid = useMutation({
  mutationFn: (id: string) => apiFetch(`/api/admin/orders/${id}/status`, { method: "POST", body: { status: "paid" } }),
  onSuccess: (_data, id) => {
    queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
    queryClient.invalidateQueries({ queryKey: keys.orders.detail(id) });
  },
});
```

**Optimistic updates only where a rollback is harmless** (an admin toggling "featured"), never for money or stock
(placing an order waits for the server).

**Server prefetch + hydration** for client-heavy pages such as the admin tables: the Server Component prefetches the
first page into a `QueryClient` and passes it down with `HydrationBoundary`, so the table renders with data on first
paint and TanStack Query takes over from there.

**DevTools in development only** (`@tanstack/react-query-devtools`): a panel showing every query, its key, status and
data. This is the best way to *see* server state while learning.

## 3. Client state with Zustand

Zustand is a tiny store: a hook you can call from any component, with no provider and no reducer boilerplate.
Components subscribe to a **slice**, so changing the cart's quantity doesn't re-render a component that only reads
`isOpen`.

### The cart, moved from React context to Zustand

Today `cart-context.tsx` is a `useReducer` + context + a `useEffect` that saves to `localStorage`. Every component
using `useCart()` re-renders on every change. With Zustand:

```ts
export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (product, qty = 1) => set((s) => ({ items: addLine(s.items, product, qty) })),
      setQty: (id, qty) => set((s) => ({ items: setLineQty(s.items, id, clampQty(qty)) })),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.productId !== id) })),
      clear: () => set({ items: [] }),
    }),
    {
      name: "farmart-cart",
      version: 2,
      // localStorage can hold anything: keep today's sanitizeCart as the gate.
      merge: (persisted, current) => ({ ...current, items: sanitizeCart((persisted as { items?: unknown })?.items) }),
      skipHydration: true, // read storage after mount, so server and client HTML match
    },
  ),
);

// In a component: subscribe to the slice you need.
const count = useCartStore((s) => s.items.reduce((n, i) => n + i.qty, 0));
```

What changes with the MVP:
- The cart keeps `productId`, `qty` and a display copy (name, image, unit, price) so the drawer can draw instantly on
  any page. The **totals the customer pays come from the server quote** (TanStack Query), and checkout sends only ids
  and quantities. An edited localStorage price can then change what the drawer shows for a moment, but never what is
  charged.
- UI state that several components share (drawer open, the last "added" toast) lives in a small `useUiStore`, separate
  from the persisted cart.

### Production practices for Zustand

- **Select slices**, never `useCartStore()` with no selector (that re-renders on every change). Use `useShallow` when
  selecting several fields.
- **Keep actions in the store**, components only call them; the logic stays testable without React (`addLine`,
  `setLineQty` are pure functions with unit tests, like `clampQty` today).
- **Persist only what must survive a reload** (cart items), with a `version` and a migration, and validate on read.
- **Hydration:** a persisted store differs between the server (empty) and the browser (saved cart). Use
  `skipHydration` and call `useCartStore.persist.rehydrate()` in an effect, as the current `loaded` flag does.
- **No server data in Zustand** (rule 1).

## 4. How it fits together: placing an order

1. Product cards call `useCartStore.getState().add(product)` → the badge (selecting `count`) updates.
2. The checkout page asks TanStack Query for the quote: key `["quote", items, couponCode]`, `POST /api/checkout/quote`.
   Changing a quantity changes the key, so a new quote is fetched; the old one stays visible meanwhile
   (`placeholderData: keepPreviousData`).
3. The address form is form state; zod validates it on the client and the server validates it again.
4. "Place order" is a mutation with an `Idempotency-Key` created once per attempt. On success: clear the cart store,
   invalidate `keys.orders.all`, go to `/orders/{id}`.
5. The order page polls the order every 10 s while it's `awaiting_payment` (`refetchInterval`), and stops once paid.

## 5. The admin dashboard

- **Lists** (orders, products): filters and page in the URL; data from `useQuery` with the filters in the key; the
  first page prefetched on the server.
- **Edits:** forms with zod; on save, a mutation, then invalidate the list and the detail.
- **Status changes:** a mutation per action, invalidating the order and the summary cards.
- **Summary cards:** `useQuery` with `refetchInterval: 60_000`.
- **No Zustand needed** except tiny UI state (a sidebar collapsed flag).

## 6. Learning path

1. Read section 1 until you can sort any piece of data into a row of the table.
2. Phase 2 adds the providers, `apiFetch`, the key factory and `useMe()` for the header. Open the Query DevTools and
   watch `["me"]` fetch, cache and refetch on window focus.
3. Phase 2 also moves the cart to Zustand. Compare the old context with the store, and count re-renders with React
   DevTools' "Highlight updates".
4. Phase 3: the quote query and the place-order mutation (the most interesting flow).
5. Phase 4: the admin tables with invalidation and server prefetch.

## 7. Open questions to discuss

- **Forms:** `react-hook-form` + zod for the bigger admin forms, or React 19's `useActionState` with server actions
  for simple ones? (Proposal: server actions for login/register, `react-hook-form` for admin edits.)
- **Server Actions vs API routes for mutations:** the spec-first API (`openapi.yaml`) favours API routes; server
  actions are simpler for forms but aren't in the contract. Proposal: API routes for anything in the spec.
- **Polling vs realtime** for the order status: polling every 10 s is enough for the MVP.
- **A learning page:** a developer-only `/state` page that shows the live Zustand store and the Query cache side by
  side, hidden in production like `/design`. Useful while learning; the Query DevTools may already be enough.
