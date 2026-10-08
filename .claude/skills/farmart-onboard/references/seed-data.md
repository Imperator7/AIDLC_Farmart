# Seed data reference

What `npm run db:seed` puts into `.data/farmart.sqlite`, and so what the store shows on a fresh setup.
It is built from `src/data/home.ts`, `src/data/product-details.ts` and `src/data/store.ts` by `scripts/seed/seed.ts` (separate from the backend; `npm run db:seed` runs it through `scripts/seed/cli.ts`).

**Don't check by eye: run `npm run db:check`.** It compares the database with these values and lists every difference.
Use this page to know what to expect, and to see where each value comes from before you change it.
If you change `src/data` on purpose, update this page too.

## Totals

| Table | Rows | Source |
|---|---|---|
| `categories` | 8 | `categoryList` in home.ts, in display order |
| `products` | 16 | `topSaver` + `bestSellers` + `justLanding` in home.ts |
| `product_details` | 16 | `productDetails` in product-details.ts (one per product) |
| `deals` | 4 | the `topSaver` products, with their `sold` |
| `banners` | 6 | `banners` in home.ts |
| `settings` | 5 | `store.ts` constants + fixed values in seed.ts |

## Categories

| # | slug | Name | Products |
|---|---|---|---|
| 1 | `fruits-vegetables` | Fruits & Vegetables | 3 |
| 2 | `breads-sweets` | Breads & Sweets | 4 |
| 3 | `frozen-seafoods` | Frozen Seafoods | 2 |
| 4 | `raw-meats` | Raw Meats | 3 |
| 5 | `wines-alcohol-drinks` | Wines & Alcohol Drinks | 2 |
| 6 | `coffees-teas` | Coffees & Teas | 0 |
| 7 | `milks-dairies` | Milks & Dairies | 1 |
| 8 | `pet-foods` | Pet Foods | 1 |

All 8 are `featured = 1`, so all show in "Browse by Category". *Coffees & Teas* has no products, so `/search?category=coffees-teas` shows the empty state. That's handy for checking it.

## Products

Prices are stored in cents (`price_cents` 195 = $1.95). "Old price" set means the product is on sale.
"Sold/stock" is filled only for today's Top Saver deals (the "Sold: x/y" bar); other products have stock 100.

### Top Saver (`topSaver`)

| id | Name | Category | Price | Old price | Stock | Deal sold | Sold this week | Added |
|---|---|---|---|---|---|---|---|---|
| `ts1` | Craft Beer Can Variety Pack 330ml x 12 | `wines-alcohol-drinks` | $29.50 | $34.00 | 50 | 35 | 20 | 2026-09-01 |
| `ts2` | British Beef Mince (10% Fat) | `raw-meats` | $8.99 | $10.00 | 50 | 25 | 57 | 2026-08-31 |
| `ts3` | Farmhouse Soft White Bread | `breads-sweets` | $2.70 | — | 40 | 25 | 34 | 2026-08-30 |
| `ts4` | Blood Oranges, Sweet & Juicy | `fruits-vegetables` | $4.15 | $4.90 | 60 | 32 | 71 | 2026-08-29 |

### Best Seller (`bestSellers`)

| id | Name | Category | Price | Old price | Stock | Deal sold | Sold this week | Added |
|---|---|---|---|---|---|---|---|---|
| `bs1` | Organic Bananas | `fruits-vegetables` | $1.95 | — | 100 | — | 400 | 2026-08-28 |
| `bs2` | Beef Sirloin Steak | `raw-meats` | $14.99 | — | 100 | — | 360 | 2026-08-27 |
| `bs3` | Sweet Yellow Melon | `fruits-vegetables` | $3.90 | $4.50 | 100 | — | 320 | 2026-08-26 |
| `bs4` | Sea Salt Potato Chips | `breads-sweets` | $2.50 | $2.95 | 100 | — | 280 | 2026-08-25 |
| `bs5` | Homemade Oatmeal Cookies | `breads-sweets` | $4.20 | — | 100 | — | 240 | 2026-08-24 |
| `bs6` | Sardines in Olive Oil | `frozen-seafoods` | $2.99 | $3.50 | 100 | — | 200 | 2026-08-23 |

### New Arrivals (`justLanding`)

| id | Name | Category | Price | Old price | Stock | Deal sold | Sold this week | Added |
|---|---|---|---|---|---|---|---|---|
| `jl1` | Fresh Salmon Poke Bowl | `frozen-seafoods` | $9.50 | $11.00 | 100 | — | 30 | 2026-10-01 |
| `jl2` | Grilled Chicken Rice Box | `raw-meats` | $6.99 | — | 100 | — | 67 | 2026-09-30 |
| `jl3` | Red Wine Cabernet 750ml | `wines-alcohol-drinks` | $18.00 | — | 100 | — | 44 | 2026-09-29 |
| `jl4` | Raw Wildflower Honey | `breads-sweets` | $7.20 | $8.40 | 100 | — | 21 | 2026-09-28 |
| `jl5` | Fresh Whole Milk 1L | `milks-dairies` | $1.50 | — | 100 | — | 58 | 2026-09-27 |
| `jl6` | Bone Biscuits for Dogs | `pet-foods` | $8.90 | — | 100 | — | 35 | 2026-09-26 |

### Values made up by the seed

These aren't in `src/data`; `seed.ts` computes them so the home rows come out in the intended order:

- **`sold_week`**: Best Sellers get 400, 360, 320 … (in list order), so `/api/products/bestsellers` returns bs1–bs6 first. Other products get 20–79.
- **`sold_month`**: `sold_week × 4 + 15`.
- **`created_at`**: New Arrivals are 0–5 days before 2026-10-01 (jl1 newest), so `/api/products/new-arrivals` returns jl1–jl6. Other products are 30+ days old.
- **Top Saver order** on the home page is biggest saving first (ts4 15%, ts1 13%, ts2 10%, ts3 0%), not list order.

## Banners

| id | Placement | Title | Links to |
|---|---|---|---|
| `bnr_hero_juice` | hero | Cold-Pressed Orange Juice 1L | `/search?q=orange` |
| `bnr_side_veg` | hero-side | 20% OFF | `/search?category=fruits-vegetables&onSale=true` |
| `bnr_foodpouch` | brand | New Snacks Release | `/search?brand=Foodpouch` |
| `bnr_tea_joy` | brand | Happy Tea 100% Organic. From $29.9 | `/search?brand=Tea%20Joy` |
| `bnr_soda` | brand | Soda Can Box 24 Pieces - 30% OFF | `/search?brand=Soda%20Brand` |
| `bnr_farmart_sausage` | brand | Fresh Meat Sausage. BUY 2 GET 1! | `/search?brand=Farmart` |

None have a schedule (`starts_at`/`ends_at` are NULL), so all are always shown.

## Settings

| key | value | Meaning |
|---|---|---|
| `currency` | `USD` | Prices are USD |
| `delivery_fee_cents` | `499` | $4.99 delivery under the threshold |
| `free_delivery_from_cents` | `5000` | Free delivery from $50.00 |
| `member_discount_percent` | `15` | Welcome discount on the sign-up card |
| `time_zone` | `Asia/Bangkok` | Top Saver deals end at midnight here |

## Quick checks in the running app

After `npm run db:seed` and `npm run dev`:

| Open | You should see |
|---|---|
| http://localhost:3000 | 8 category circles, Top Saver ts4 → ts1 → ts2 → ts3 with a countdown, Best Seller bs1–bs6, New Arrivals jl1–jl6 |
| http://localhost:3000/search?q=oat | 1 product: Homemade Oatmeal Cookies |
| http://localhost:3000/search?category=fruits-vegetables | 3 products |
| http://localhost:3000/search | "All products", 16 products over 2 pages |
| http://localhost:3000/api/store/settings | `{"currency":"USD","freeDeliveryFrom":50,"deliveryFee":4.99,"memberDiscountPercent":15}` |
