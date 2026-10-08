---
version: alpha
name: Farmart
description: A bright, everyday online grocery store that should feel like a
  well-lit supermarket aisle, not a tech product. Real product photography
  does the selling; a single Harvest Amber accent marks every buying moment
  (add to cart, shop now, active states). Surfaces are white on a soft gray
  page floor, type is compact and information-dense like a price tag, and
  urgency (discounts, countdowns) is the only place red is allowed.

colors:
  primary: "#FFB900"          # Tailwind amber-400 — Harvest Amber
  primary-hover: "#FE9A00"    # amber-500
  primary-soft: "#FEF3C6"     # amber-100 — resting fill of the add button
  primary-ink: "#BB4D00"      # amber-700 — amber used as text on white (5.1:1)
  ink: "#101828"              # gray-900
  body: "#364153"             # gray-700
  muted: "#6A7282"            # gray-500
  subtle: "#99A1AF"           # gray-400 — non-text only (2.6:1 on white)
  canvas: "#FFFFFF"
  canvas-soft: "#F3F4F6"      # gray-100
  surface-card: "#FFFFFF"
  surface-tint: "#F9FAFB"     # gray-50 — image wells
  surface-warm: "#FFF7ED"     # orange-50 — member sign-up card
  hairline: "#E5E7EB"         # gray-200
  hairline-soft: "#F3F4F6"    # gray-100
  control-border: "#D1D5DC"   # gray-300
  link: "#0069A8"             # sky-700
  sale: "#E7000B"             # red-600 — 4.8:1 as text and under white text
  sale-soft: "#FB2C36"        # red-500 — large text only (3.6:1 on surface-warm)
  sale-hover: "#C10007"       # red-700
  success: "#007A55"          # emerald-700 — 5.4:1 as text (emerald-600 was 3.8:1)
  success-bar: "#00BC7D"      # emerald-500
  on-primary: "#101828"
  on-sale: "#FFFFFF"
  scrim: "rgba(0,0,0,0.4)"

typography:
  display:
    fontFamily: "Geist, Arial, Helvetica, sans-serif"
    fontSize: 30px
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: 0
  headline:
    fontFamily: "Geist, Arial, Helvetica, sans-serif"
    fontSize: 24px
    fontWeight: 700
    lineHeight: 1.33
    letterSpacing: 0
  section-title:
    fontFamily: "Geist, Arial, Helvetica, sans-serif"
    fontSize: 18px
    fontWeight: 700
    lineHeight: 1.55
    letterSpacing: 0
  body-md:
    fontFamily: "Geist, Arial, Helvetica, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  nav:
    fontFamily: "Geist, Arial, Helvetica, sans-serif"
    fontSize: 13px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0
  body-sm:
    fontFamily: "Geist, Arial, Helvetica, sans-serif"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.33
    letterSpacing: 0
  button:
    fontFamily: "Geist, Arial, Helvetica, sans-serif"
    fontSize: 12px
    fontWeight: 700
    lineHeight: 1
    letterSpacing: 0
  price:
    fontFamily: "Geist, Arial, Helvetica, sans-serif"
    fontSize: 14px
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: 0
  meta:
    fontFamily: "Geist, Arial, Helvetica, sans-serif"
    fontSize: 11px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0
  eyebrow:
    fontFamily: "Geist, Arial, Helvetica, sans-serif"
    fontSize: 12px
    fontWeight: 600
    lineHeight: 1.33
    letterSpacing: 0.1em
    textTransform: uppercase
  badge:
    fontFamily: "Geist, Arial, Helvetica, sans-serif"
    fontSize: 10px
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: 0

rounded:
  none: 0px
  xs: 2px      # discount badges, carousel arrows
  sm: 4px      # rectangular buttons, inputs
  md: 6px      # cards, banners, image wells
  full: 9999px # pill controls, category circles, count badges

spacing:
  xs: 4px
  sm: 8px
  md: 12px
  base: 16px    # card padding, page gutter
  lg: 20px      # grid gaps between cards/banners
  xl: 24px
  2xl: 32px
  section: 40px # vertical rhythm between homepage sections
  container: 1152px

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.sm}"
    padding: 10px 24px
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-dark:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.canvas}"
    typography: "{typography.button}"
    rounded: "{rounded.sm}"
    padding: 10px 24px
  button-light:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.sm}"
    padding: 10px 20px
  button-ghost:
    backgroundColor: "{colors.surface-card}"
    borderColor: "{colors.hairline}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.sm}"
    padding: 10px 24px
  button-danger:
    backgroundColor: "{colors.sale}"
    textColor: "{colors.on-sale}"
    typography: "{typography.button}"
    rounded: "{rounded.sm}"
    padding: 10px 24px
  add-button:
    backgroundColor: "{colors.primary-soft}"
    borderColor: "{colors.primary}"
    borderWidth: 2px
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.full}"
    height: 32px
  qty-stepper:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.full}"
    height: 32px
  add-button-lg:
    backgroundColor: "{colors.primary-soft}"
    borderColor: "{colors.primary}"
    borderWidth: 2px
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.full}"
    height: 48px
  qty-stepper-lg:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.full}"
    height: 48px
  product-card:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "{spacing.base}"
  breadcrumb:
    textColor: "{colors.muted}"
    currentColor: "{colors.ink}"
    typography: "{typography.body-sm}"
  product-gallery:
    backgroundColor: "{colors.surface-tint}"
    rounded: "{rounded.md}"
    ratio: 1:1
    thumbSize: 64px
  price-block:
    priceColor: "{colors.ink}"
    saleColor: "{colors.sale}"
    oldPriceColor: "{colors.muted}"
    typography: "{typography.display}"
  stock-badge:
    inStockColor: "{colors.success}"
    lowStockColor: "{colors.primary-ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.full}"
  tag:
    backgroundColor: "{colors.canvas-soft}"
    textColor: "{colors.body}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.full}"
    padding: 4px 12px
  benefit-list:
    iconColor: "{colors.success}"
    textColor: "{colors.body}"
    typography: "{typography.body-sm}"
    borderColor: "{colors.hairline}"
    rounded: "{rounded.md}"
  accordion:
    borderColor: "{colors.hairline}"
    titleColor: "{colors.ink}"
    titleTypography: "{typography.body-md}"
    bodyTypography: "{typography.body-md}"
    bodyColor: "{colors.body}"
  product-card-featured:
    backgroundColor: "{colors.surface-card}"
    borderColor: "{colors.hairline}"
    rounded: "{rounded.md}"
    padding: "{spacing.base}"
  badge-discount:
    backgroundColor: "{colors.sale}"
    textColor: "{colors.on-sale}"
    typography: "{typography.badge}"
    rounded: "{rounded.xs}"
    padding: 2px 6px
  countdown-chip:
    backgroundColor: "{colors.sale}"
    textColor: "{colors.on-sale}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.xs}"
    padding: 4px 12px
  sold-bar:
    trackColor: "{colors.hairline}"
    fillColor: "{colors.primary}"
    height: 4px
    rounded: "{rounded.full}"
  hero-banner:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "{spacing.2xl}"
  promo-banner:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "{spacing.xl}"
  category-tile:
    imageRounded: "{rounded.full}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
  brand-card:
    imageRounded: "{rounded.md}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
  section-title:
    textColor: "{colors.ink}"
    typography: "{typography.section-title}"
  carousel-arrow:
    backgroundColor: "{colors.hairline}"
    textColor: "{colors.muted}"
    rounded: "{rounded.xs}"
    size: 24px
  nav-category-button:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.sm}"
    padding: 8px 16px
  nav-link:
    textColor: "{colors.ink}"
    typography: "{typography.nav}"
    rounded: "{rounded.sm}"
    padding: 8px 10px
  search-bar:
    backgroundColor: "{colors.canvas-soft}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    height: 40px
  search-suggestions:
    backgroundColor: "{colors.surface-card}"
    activeColor: "{colors.primary-soft}"
    textColor: "{colors.body}"
    labelTypography: "{typography.eyebrow}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    rowHeight: 44px
  count-badge:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.badge}"
    rounded: "{rounded.full}"
  input-field:
    backgroundColor: "{colors.surface-card}"
    borderColor: "{colors.hairline}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.sm}"
    height: 36px
  signup-card:
    backgroundColor: "{colors.surface-warm}"
    textColor: "{colors.body}"
    rounded: "{rounded.md}"
    padding: "{spacing.xl}"
  cart-drawer:
    backgroundColor: "{colors.surface-card}"
    scrimColor: "{colors.scrim}"
    width: 448px
    rounded: "{rounded.none}"
  dialog:
    backgroundColor: "{colors.surface-card}"
    scrimColor: "{colors.scrim}"
    textColor: "{colors.body}"
    titleTypography: "{typography.section-title}"
    bodyTypography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: "{spacing.xl}"
    width: 400px
  cart-toast:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.body}"
    iconColor: "{colors.success}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    width: 360px
  trust-strip:
    backgroundColor: "{colors.surface-card}"
    iconColor: "{colors.success}"
    textColor: "{colors.body}"
    typography: "{typography.body-sm}"
    borderColor: "{colors.hairline}"
  site-footer:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.muted}"
    headingColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    borderColor: "{colors.hairline}"
  filter-chip:
    backgroundColor: "{colors.surface-card}"
    borderColor: "{colors.hairline}"
    activeBackgroundColor: "{colors.primary-soft}"
    activeBorderColor: "{colors.primary}"
    textColor: "{colors.body}"
    typography: "{typography.button}"
    rounded: "{rounded.full}"
    height: 32px
  sort-select:
    backgroundColor: "{colors.surface-card}"
    borderColor: "{colors.hairline}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.sm}"
    height: 36px
  pagination:
    backgroundColor: "{colors.surface-card}"
    borderColor: "{colors.hairline}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.sm}"
    height: 36px
  search-empty:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.body}"
    titleTypography: "{typography.section-title}"
    rounded: "{rounded.md}"
    padding: 56px 24px
  error-page:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.body}"
    titleTypography: "{typography.section-title}"
    rounded: "{rounded.md}"
    padding: 56px 24px
---

## Overview

Farmart should read like a real neighbourhood grocery chain that happens to
live online. The customer is busy and price-aware; they scan, compare, and
drop things into a basket. So the page is dense and orderly like a supermarket
shelf: white product plates on a soft gray floor ({colors.canvas-soft}), small
but legible type, and lots of products visible at once.

The voltage comes from one color only: Harvest Amber {colors.primary}
(#FFB900). It marks every place where money moves forward: the Add button,
the quantity pill, Shop Now, the "Shop by Category" button, the cart count.
If something is amber, the customer can buy with it. Red {colors.sale} is
reserved for urgency (discount badges, sale prices, countdown chip) and
never used as decoration.

Photography carries the emotion. Every product, category and promo uses a real
photo, cropped to fill its frame. Emoji or cartoon illustrations are banned
for products because they make the shop feel fake. Icons are thin line SVGs
(1.6–2px stroke) that inherit `currentColor`.

**Key Characteristics:**
- Single action color: {colors.primary} on everything that adds to the basket or navigates to buy.
- Red only for urgency: {colors.sale} for "Save x%", struck-through comparisons, and the countdown.
- Real photos everywhere, using `object-cover` inside fixed-ratio wells. No emoji for products.
- Compact, price-tag type: most product copy sits at 11–12px, prices bold at 14px.
- Flat by default: cards separate by a 1px white gap on the gray floor and gain a shadow only on hover.
- Pills for quantity, rectangles for navigation. Rounded-full controls change the basket; 4px-radius buttons go somewhere.

## Colors

### Brand & Accent
- **Harvest Amber** ({colors.primary} — #FFB900): The only brand color. Add button border and fill, quantity pill, Shop by Category button, count badges, sold-progress fill, active carousel arrow, focus rings on category circles.
- **Amber Hover** ({colors.primary-hover} — #FE9A00): Pressed/hover state of any amber fill.
- **Amber Soft** ({colors.primary-soft} — #FEF3C6): The resting fill of `add-button` and `add-button-lg`, so the buy action is visible before hover (touch devices never hover).
- **Amber Ink** ({colors.primary-ink} — #BB4D00): Amber used as *text* on white (eyebrow labels, hovered links, low-stock badge). The base amber fails contrast as text (1.7:1), and amber-600 still fails at small sizes (3.2:1), so text uses amber-700 (5.1:1).

### Surface
- **Canvas** ({colors.canvas} — #FFFFFF): Header, product cards, banners, drawer.
- **Canvas Soft** ({colors.canvas-soft} — #F3F4F6): The page floor behind hero and product rows. It's what makes white cards read as separate plates without borders.
- **Surface Tint** ({colors.surface-tint} — #F9FAFB): Background of image wells while a photo loads.
- **Surface Warm** ({colors.surface-warm} — #FFF7ED): Only the member sign-up card. Warmth signals "this is a gift, not a sale."

### Hairlines
- **Hairline** ({colors.hairline} — #E5E7EB): Header bottom border, featured card border, input borders, progress tracks.
- **Hairline Soft** ({colors.hairline-soft} — #F3F4F6): Dividers inside the nav and the cart list.
- **Control Border** ({colors.control-border} — #D1D5DC): Neutral form-control outlines.

### Text
- **Ink** ({colors.ink} — #101828): Headlines, product brand line, prices, primary labels.
- **Body** ({colors.body} — #364153): Paragraph copy.
- **Muted** ({colors.muted} — #6A7282): The lightest gray allowed for text (4.8:1 on white). Secondary labels, units, review counts, struck-through old prices, placeholders, "All Offers ›" links. On {colors.canvas-soft} use gray-600 instead, because muted drops to 4.4:1 there.
- **Subtle** ({colors.subtle} — #99A1AF): Non-text only: empty stars, separators, disabled glyphs, input icons. At 2.6:1 it is never used for words.
- **Link** ({colors.link} — #0069A8): Product names. Blue tells the customer that the name opens the product page.

### Semantic
- **Sale** ({colors.sale} — #E7000B): Discount badge, discounted price, countdown chip, destructive hover (Remove), and the fill of `button-danger`. Destroying the customer's basket is the one non-price use, because it is just as irreversible.
- **Sale Hover** ({colors.sale-hover} — #C10007): Hover/pressed state of `button-danger`.
- **Sale Soft** ({colors.sale-soft} — #FB2C36): The big "15% OFF" member headline, which is softer because it's an invitation, not a warning. Large text only.
- **Success** ({colors.success} — #007A55) and **Success Bar** ({colors.success-bar} — #00BC7D): Free-delivery messaging and its progress bar in the cart.

### Browser surfaces
- **Icons:** line icons from `src/components/icons.tsx` (24px grid, currentColor, 2px stroke, round caps) and a filled star for ratings. No Unicode glyphs or emoji stand in for icons; typographic arrows inside text links ("All Offers ›", breadcrumb separators) are punctuation, not icons. Icons are decorative (`aria-hidden`) unless they carry meaning on their own, like a pass/fail mark: give those an `aria-label` and `role="img"`, and they stay visible to screen readers.
- **Focus ring:** every interactive element shows a 2px {colors.ink} outline with a 2px offset on `:focus-visible` (set once in `globals.css`). Ink works on white, gray and amber surfaces alike, where an amber ring would vanish on amber buttons.
- **Text selection:** amber-200 background with {colors.ink} text, so even selection stays on brand.
- **Reduced motion:** with `prefers-reduced-motion: reduce`, the drawer appears without sliding and photos don't zoom on hover. Fades and color changes stay, so state changes are still visible.

## Typography

One family: **Geist** (loaded via `next/font/google`), falling back to Arial/Helvetica.

| Role | Size | Weight | Used for |
|---|---|---|---|
| `display` | 30px (24px mobile) | 700 | Hero headline only |
| `headline` | 24px | 700 | Promo banner headline ("20% OFF"), drawer-free big numbers |
| `section-title` | 18px | 700 | "Browse by Category", "Best Seller"… |
| `body-md` | 14px | 400 | Hero paragraph, search input, cart item names |
| `nav` | 13px | 600 | Desktop nav links |
| `body-sm` | 12px | 400–600 | Product names, tabs, category labels |
| `button` | 12px | 700 | All buttons and pills |
| `price` | 14px | 700 | Current price (ink, or sale red when discounted) |
| `meta` | 11px | 400 | Brand line, unit, stars, "Sold: x/y" |
| `eyebrow` | 12px | 600, uppercase, 0.1em tracking | Hero kicker ("SUMMER FRESH") in amber ink |
| `badge` | 10px | 700 | Discount badge, count badges |

### Principles
- Information density beats drama. Product cards stack brand, name, stars, unit and price in under 100px of height, like a shelf label.
- Hierarchy comes from weight and color, not size. Price is bold ink and the unit is muted gray, both at about the same size.
- The only large type is in the hero and promo banners. Sections never get headlines over 18px.
- Numbers that change (quantity, countdown) use `tabular-nums` so they don't jitter.

### Note on Font Substitutes
Geist is open source. If unavailable, use Inter at the same sizes; avoid geometric display faces, because the store should feel practical, not fashionable.

## Layout

- **Container:** max width {spacing.container} (1152px, Tailwind `max-w-6xl`), centered, with a {spacing.base} (16px) side gutter at every breakpoint.
- **Section rhythm:** {spacing.section} (40px) vertical padding between homepage sections. Product rows on the gray floor use 32px.
- **Grid gaps:** {spacing.lg} (20px) between banners, brand cards and the Top Saver/sign-up split. Product rows use a **1px gap on white** to read as one continuous shelf.
- **Card padding:** {spacing.base} (16px) inside product cards and the sign-up card. Banners use {spacing.2xl} (32px).
- **Section header:** title + muted "All x ›" link on the left, and carousel arrows pushed to the far right with `ml-auto`. Tabs or the countdown sit between them.
- **Image ratios:** product wells 1:1, brand cards 16:10, categories 1:1 circles, hero photo fills its half of the banner.

### Product Detail Page

Route `/products/[id]`. Top to bottom:
1. Header (shared), then a `breadcrumb` 16px below.
2. **Buy area**: two equal columns on desktop (≥ 1024px), stacked on mobile. Left: `product-gallery`. Right, in reading order: brand (`eyebrow`, amber-ink), name (`headline`, 24px bold), `stars` + review count, `price-block`, `stock-badge`, up to 3 `tag`s, a hairline divider, `add-button-lg` / `qty-stepper-lg`, then `benefit-list`. The 32px column gap keeps the photo and decision area visually separate.
3. **Information**: an `accordion` (Description, Product details, Delivery & returns), max 768px wide so lines stay readable.
4. **Related products**: a `section-title` ("You may also like") over a 6-up `product-card` row on the {colors.canvas-soft} floor, same as homepage rows. Same-category products come first.

The buy area is white on white (no card plate). The product page is a single item's shelf label, not a grid, so no plates are needed.

### Search Results Page

Route `/search` (`?q`, `category`, `brand`, `onSale`, `sort`, `page`). It is also the category listing: category tiles, banners and brand cards link here with filters already set. Top to bottom:
1. Header (shared, the `search-bar` showing the current query), then on a white band: `breadcrumb`, the title (`Results for “q”`, or the category or brand name, or "All products") in `headline`, the count ("3 products in Raw Meats, on sale") in `body-md` gray-600 and `sort-select` on the right (below the title on phones), then a row of `filter-chip`s: All categories, each category, a divider, On sale, and the brand when one is set.
2. **Results** on the {colors.canvas-soft} floor: the same 1px-gap `product-card` grid as homepage rows (6 → 3 → 2 up), no featured card. Or `search-empty`.
3. `pagination`, then the `site-footer`.

Bad or unknown filters in the URL are dropped rather than shown as an error page.

### Whitespace Philosophy
Generous around sections, tight inside cards. The customer should see six products in a row on desktop without scrolling sideways. Whitespace separates *groups*, not individual facts.

## Elevation

| Tier | Style | Used for |
|---|---|---|
| Flat | none | Default product cards, banners, category tiles |
| Lifted | `shadow-md` + {rounded.md} | The featured card (biggest saving) of a product row |
| Hover | `shadow-lg` | Any product card on hover |
| Dropdown | `shadow-lg`, no scrim | Mobile menu panel, `search-suggestions`. Floats over content but is not modal. |
| Toast | `shadow-lg`, no scrim | `cart-toast`. Floats above the page bottom, never blocks it. |
| Overlay | `shadow-2xl` + {colors.scrim} | Cart drawer, dialog. See **Overlays** below. |

Images scale to 105% (products, brands) or 110% (categories) on hover with a 300ms transform. Besides that, only the drawer slides and the `cart-toast` rises 8px while fading in (200ms ease-out). Both respect reduced motion.

## Components

**`button-primary`**: The default buying button. Background `{colors.primary}`, text `{colors.on-primary}`, type `{typography.button}`, rounded `{rounded.sm}`, padding 10px × 24px. Used for Register Now, Checkout (full width, 12px vertical), Continue Shopping.

**`button-primary-hover`**: The hover/pressed state of `button-primary`. Background shifts to `{colors.primary-hover}`.

**`button-dark`**: Hero "Shop Now" on a white banner. Background `{colors.ink}`, text `{colors.canvas}`, `{typography.button}`, `{rounded.sm}`. On hover it flips to amber with ink text, so the dark button still lands on the brand color.

**`button-light`**: "Shop Now" placed *on* the amber promo banner, where amber-on-amber would vanish. Background `{colors.surface-card}`, text `{colors.ink}`, `{rounded.sm}`. Hover goes to ink.

**`button-ghost`**: The quiet "back out" action, always paired with a stronger button (Cancel next to Confirm). White `{colors.surface-card}` with a 1px `{colors.hairline}` border, `{colors.ink}` text, `{typography.button}`, `{rounded.sm}`. Hover tints to `{colors.surface-tint}`. Never the only button on a surface.

**`button-danger`**: Confirms an irreversible action such as clearing the cart. `{colors.sale}` fill, `{colors.on-sale}` text, `{typography.button}`, `{rounded.sm}`. Hover goes to `{colors.sale-hover}`. It only appears inside a `dialog` and is never a first-click action on the page.

**`add-button`**: The resting state of every product's cart control. A 32px-high full-width pill with a `{colors.primary-soft}` fill and a 2px `{colors.primary}` border (a bare 1px outline was the faintest thing on the card), label "+ Add" in `{typography.button}`, rounded `{rounded.full}`. Hover fills it with `{colors.primary}`. It is always visible, never hover-only, because touch devices have no hover.

**`qty-stepper`**: What `add-button` becomes once the product is in the cart. Same 32px pill, filled `{colors.primary}`, with − / quantity / + as line icons (never text glyphs). Each button is a 32px circle that darkens to `{colors.primary-hover}`. At quantity 1 the − becomes a trash icon and removes the item. It is bound to the cart directly, with no separate "Add To Cart" step. The cart drawer uses this same stepper, so quantity works the same everywhere.

**`add-button-lg`**: The `add-button` at product-page scale, where adding to the cart is *the* action on the screen. 48px high (it meets the 44px touch target), `{typography.body-md}` bold, with the label "+ Add to cart" and the same soft fill → solid amber on hover. Solid amber always means "in the basket" (the stepper) or "about to be" (hover).

**`qty-stepper-lg`**: The `qty-stepper` at 48px with 48px circular buttons and the quantity in `{typography.body-md}` bold. Its behavior is identical (trash at 1, bound to the cart), so the product page and the cards always agree on the quantity.

**`product-card`**: White plate, `{spacing.base}` padding, no radius (cards tile edge to edge with 1px gaps). Top to bottom: 1:1 photo well (`{rounded.md}`, `{colors.surface-tint}`), brand (`meta`, ink, semibold), name (`body-sm`, `{colors.link}`, 2-line clamp), stars (amber filled / gray empty + count), unit (`meta`, muted), price, optional sold bar, then the cart control pinned to the bottom with `mt-auto` so buttons align across a row. The photo and the name both link to the product page.

**`breadcrumb`**: The path back from a product: Home › Category › Product. Links are `{typography.body-sm}` in `{colors.muted}` and turn amber-ink on hover. The current page is `{colors.ink}`, not a link, and truncates on small screens. Separators are a light gray ›. Wrapped in `nav[aria-label=Breadcrumb]` with `aria-current="page"` on the last item.

**`product-gallery`**: The product page photo. A 1:1 well in `{colors.surface-tint}`, `{rounded.md}`, with the photo `object-cover` and a gentle 105% zoom on hover. The `badge-discount` sits top-left, as on cards. With more than one photo, a row of 64px square thumbnails sits below. The active thumbnail gets a 2px `{colors.primary}` ring, and the others are 70% opacity until hovered. With a single photo the thumbnail row is hidden rather than showing one lonely thumb.

**`price-block`**: The large price on the product page. Current price in `{typography.display}` (30px bold), in `{colors.sale}` when discounted or `{colors.ink}` otherwise. The old price is struck through in `{colors.muted}` at 18px beside it. When discounted, a `badge-discount` and a line "You save $x.xx" in `{colors.sale}` follow. The unit ("per 500g") sits below in `meta`. Saving is spelled out in money because "Save 12%" alone makes the customer do math.

**`stock-badge`**: A small pill with a dot showing availability. "In stock" is `{colors.success}` text on a 10% tint. "Only N left" (≤ 20 units) is `{colors.primary-ink}` on an amber tint, which creates urgency without using sale red, because low stock is not a discount.

**`tag`**: A neutral, non-interactive pill for product facts ("Gluten free", "21-day aged"). `{colors.canvas-soft}` background, `{colors.body}` text in `{typography.body-sm}`, `{rounded.full}`, 4px × 12px padding. It is deliberately gray so it never competes with amber (buy) or red (sale). Show at most 3 on a product.

**`benefit-list`**: The reassurance strip under the buy button: free delivery threshold, freshness guarantee, easy returns. It is a 1px `{colors.hairline}` bordered box (`{rounded.md}`) with rows of a 16px line icon in `{colors.success}` and `{typography.body-sm}` `{colors.body}` text. Keep it to 3 rows; more becomes noise.

**`accordion`**: Collapsible content sections (Description, Product details, Delivery & returns). Each item is a native `<details>`: a full-width row in `{typography.body-md}` semibold ink with a chevron that rotates 180° when open, and a `{colors.hairline}` divider between items. The body is `{typography.body-md}` `{colors.body}` with 16px bottom padding. The first item opens by default. Uses native `<details>`, so it works without JavaScript and with the keyboard.

**`product-card-featured`**: The card with the biggest saving in a row (no card is featured when nothing in the row is discounted), so emphasis always means "best deal here". Same content as `product-card`, lifted with `{rounded.md}` and `shadow-md` only: one elevation, no extra border.

**`badge-discount`**: "Save x%" in the top-left corner of a product photo. `{colors.sale}` background, white `{typography.badge}`, `{rounded.xs}`, 2px × 6px padding. Shown only when the product has an old price.

**`countdown-chip`**: A clock icon and "Expires in hh:mm:ss" next to the Top Saver title. `{colors.sale}` background, white text, `{rounded.xs}`, tabular numbers. It never wraps; on mobile it drops to its own line under the title.

**`sold-bar`**: 4px track in `{colors.hairline}` with a `{colors.primary}` fill and a `meta` "Sold: x/y" label below. It creates social proof and scarcity without extra color.

**`hero-banner`**: Two columns on a white plate, `{rounded.md}`. Text on the left (eyebrow, `display` headline, `body-md` copy, `button-dark`), and the photo fills the right column. Text never overlaps the photo. On mobile the hero drops its paragraph, the photo is 128px tall and the promo banner hides its photo, so the category row starts on the first screen.

**`promo-banner`**: The side banner. Photo on top (144px), then a solid `{colors.primary}` block with a `headline` offer and a `button-light`.

**`category-tile`**: A 1:1 circular photo (`{rounded.full}`) with a `body-sm` semibold label below. Hover shows a 2px amber ring with an offset, a 110% photo zoom and an amber-ink label.

**`brand-card`**: A 16:10 photo (`{rounded.md}`), then an uppercase 10px muted brand name, then a semibold `body-sm` offer title.

**`section-title`**: `{typography.section-title}` in ink, followed by a muted 12px "All x ›" link. Product rows put tabs after it: the active tab is ink bold with a 2px amber underline (amber already means "selected" on the carousel arrow) and `aria-pressed`; inactive tabs are gray-600. On mobile the tabs become one horizontally scrolling row under the title instead of wrapping.

**`carousel-arrow`**: 24px squares, `{rounded.xs}`, `{colors.hairline}` background with muted chevrons. The "next" arrow on Browse by Category is amber to hint at more content.

**`nav-category-button`**: The amber "☰ SHOP BY CATEGORY" button that anchors the left of the nav bar. `{colors.primary}`, `{typography.button}`, `{rounded.sm}`.

**`nav-link`**: `{typography.nav}` ink text with 8px × 10px padding and `{rounded.sm}`. Hover shows a `{colors.surface-tint}` background and amber-ink text. Links with sub-menus get a small gray chevron. "Deals Today" and "Special Prices" carry colored line icons (amber bolt, red percent).

**`search-bar`**: A 40px-high `{colors.canvas-soft}` field, `{rounded.md}`, with an "All categories" select (filled from the catalog), a 1px divider, the input, and a search icon. Enter or the icon opens `/search?q=…&category=…`; it is a real GET form, so it works without JavaScript. Typing shows `search-suggestions`. On the results page it keeps the current query and category. Below 768px it drops to a full-width row under the logo bar (without the category select, so a phone search always covers every category), so search is never missing on a phone.

**`search-suggestions`**: The autocomplete under `search-bar`, 150ms after typing stops. A white `{rounded.md}` panel, `shadow-lg` (Dropdown tier), 8px below the field and as wide as it. Up to 5 products (40px photo, name with the matched word in bold ink, price), up to 3 categories (grid icon, name, "Category" in muted), then a hairline and "Search for “q”". Group labels use the `eyebrow` style. Rows are 44px. The highlighted row (arrow keys or hover) gets the `{colors.primary-soft}` fill, because amber means selected. It is an ARIA combobox: ↑/↓ move, Enter opens the row, Escape or leaving the field closes it, and a polite live region announces the count. With no matches it says "No products match “q”" instead of an empty panel. A failed request keeps the last results quietly; submitting still runs the full search.

**`count-badge`**: A small amber pill on the wishlist and cart icons showing the item count in `{typography.badge}`. Hidden at 0, because an empty count is noise.

**`input-field`**: White, 1px `{colors.hairline}` border, `{rounded.sm}`, 12px text, with a 14px line icon inset on the left. Focus changes the border to `{colors.primary}` and shows the standard ink focus ring (amber alone is too faint to find). Every field has a real label (`aria-label` when the design shows none), never just its placeholder.

**`signup-card`**: `{colors.surface-warm}` plate, `{rounded.md}`, centered: "15% OFF" in `{colors.sale-soft}` at 24px bold (smaller than the deals it sits beside), one line of copy ("your first order when you join"), three `input-field`s, then a `button-primary`. Below 1024px the card is capped at 384px and centered, so its inputs never stretch across a tablet.

**`cart-drawer`**: Slides in from the right (300ms translate), 448px max width, full height, white, over a `{colors.scrim}` backdrop. It has a header with the item count, a free-delivery progress strip, a scrollable item list (80px thumbnail, name on up to 2 lines, brand · unit, the same compact amber `qty-stepper` as product cards (its trash icon at 1 is the only remove control), line price with struck old price), and a gray-50 footer with Subtotal / Product discounts (red) / Delivery (green "FREE" at $50+) / Total. Escape or clicking the scrim closes it, the page behind doesn't scroll, and the page is `inert` while it's open so Tab stays inside. Counts read "1 item" / "2 items".

**`cart-toast`**: A small non-modal confirmation after "+ Add" (not after every + on a stepper). White card, `{rounded.md}`, `shadow-lg` only, bottom-right on desktop. On mobile it is a single 56px line (check, "Added · $total", "View cart") so it doesn't cover the next row's Add buttons. A green check, "Added {product}", then the running total and either "$x to FREE delivery" or "FREE delivery unlocked", and a "View cart" `button-primary` that opens the drawer. Disappears after 4 seconds, pauses while hovered or focused, never shows while the drawer is open, and is announced through one `aria-live="polite"` region (no nested `role="status"`). It exists because the header (and its cart total) scrolls away on a long page.

**`trust-strip`**: A slim white band under the nav with the store's promises as `benefit-list` items in a row: free delivery over $50, freshness guarantee, easy returns within 24 hours. Same green line icons and `{typography.body-sm}`; below 640px only the free-delivery promise shows (one line), because the strip must not push products down. Only facts the store already states elsewhere (cart, product page) appear here.

**`site-footer`**: Closes every store page. White band with a `{colors.hairline}` top border: the logo and one sentence about the store, then short columns (Delivery, Help) in `{typography.body-sm}` muted text with ink headings, and a bottom row with the support phone and copyright. Plain text until those pages exist; no `#` links.

**`filter-chip`**: One filter on the results page, as a link that toggles it (so it works without JavaScript). A `{rounded.full}` pill, 1px `{colors.hairline}` border on white, `{typography.button}` in `{colors.body}`; hover turns the border amber. Active chips get a `{colors.primary-soft}` fill, `{colors.primary}` border, ink text and a check icon, with `aria-current`. 40px tall on phones, 32px from 640px. They scroll in one row on phones and wrap from 640px, so the active one is never hidden on a wide screen.

**`sort-select`**: A native select with a visible "Sort by" label, white with a `{colors.hairline}` border, `{rounded.sm}`, `{typography.button}` in ink, 40px tall on phones and 36px from 640px. Changing it reloads the results in the new order and goes back to page 1. Without a query, "Best match" has nothing to match, so the first option reads "Best selling".

**`pagination`**: Previous, "Page x of y", Next, centered under the grid. The steps are `button-ghost`-style links (44px tall on phones, 36px from 640px) with chevron icons; at either end the step stays in place as a gray-50, muted, `aria-disabled` label so the layout doesn't jump. Hidden when the results fit on one page. Results pages are 12 products, two full rows at 6-up.

**`search-empty`**: Replaces the grid when nothing matches. A white `{rounded.md}` plate on the gray floor, centered: a 48px gray circle with the search icon, "No products match “q”" in `{typography.section-title}`, one line of advice, then a `button-ghost` "Clear filters" (only when a filter is on) and a `button-primary` "Browse all products". It always offers a way forward, never a dead end.

**`error-page`**: What any page shows when it fails on the server (`src/app/error.tsx`), in place of Next's default screen. The same centered white `{rounded.md}` plate as `search-empty`, on the gray floor under a white bar with just the logo (the full header needs the database, which may be what failed). A 48px gray circle with an alert icon (gray, not red: nothing is on sale or urgent, and alarm doesn't help), "We couldn't load this page" in `{typography.section-title}`, one line saying it's on our side, then `button-primary` "Try again" (re-fetches the page; it recovers on its own once the cause is fixed) and `button-ghost` "Go to the home page". Under them, in `{colors.muted}`, "Reference: <digest>" so a customer can quote it and we can find the error in the server log. The real error message is never shown to customers; in development only, it appears in a gray box labelled "Development only" to save a trip to the terminal.

**`dialog`**: A centered modal for decisions that need the customer's full attention (confirming a destructive action, short notices). `{colors.surface-card}` panel, `{rounded.md}`, `{spacing.xl}` (24px) padding, 400px max width (16px gutter on mobile), `shadow-2xl` over a `{colors.scrim}` backdrop. It stacks above everything, including the cart drawer. Content order: title in `{typography.section-title}` ink, then body copy in `{typography.body-md}` `{colors.body}`, then actions right-aligned with a 12px gap: `button-ghost` (Cancel) first, then the primary action (`button-primary`, or `button-danger` for destructive). Behavior: it uses the native `<dialog>` modal, so focus is trapped and the page behind is inert. Focus starts on the safest action (Cancel for destructive dialogs). Escape, the scrim or Cancel close it, focus returns to the trigger, and the page behind doesn't scroll. Opening is a 150ms fade + 95%→100% scale; closing is instant so the customer's choice feels immediate. Use a dialog only for decisions; information that doesn't need a choice belongs inline, not in a modal.

## Overlays

An **overlay** is any surface that sits *on top of* the page and temporarily takes over: the page dims behind a scrim and the customer deals with the overlay before going back. Farmart has exactly two: the `dialog` and the `cart-drawer`. They share one skeleton (scrim → container → header → body → footer) and one behavior contract, and differ only where their jobs differ.

The `cart-toast` is **not** an overlay either: it has no scrim, takes no focus, and never blocks the page.

The mobile menu dropdown is **not** an overlay: it has no scrim, doesn't block the page, and is just navigation that pushes over content (Dropdown tier in Elevation).

### Which one to use

| | `dialog` | `cart-drawer` |
|---|---|---|
| Job | Ask for **one decision** ("Clear your cart?") | A **workspace** the customer stays in (review and edit the basket) |
| Content size | 1 title + 1–2 sentences | Unbounded list that scrolls |
| Where | Centered on screen | Slides in from the right edge |
| Closes when | A choice is made, or Cancel / Escape / scrim | The customer is done: × / Escape / scrim / Continue Shopping |
| Can open on top of the other? | Yes, a dialog may open over the drawer | Never on top of a dialog |

Rule of thumb: if the customer needs to *choose*, use a dialog. If they need to *work on something* without losing their place on the page, use a drawer. If neither, show it inline. Don't add an overlay.

### Anatomy

Both overlays are built from the same five layers, top to bottom in z-order:

| Layer | `dialog` | `cart-drawer` |
|---|---|---|
| **Scrim** | {colors.scrim} (black 40%) full-viewport; click closes | Same |
| **Container** | {colors.surface-card}, {rounded.md}, 400px max (16px gutter on mobile), centered, `shadow-2xl` | {colors.surface-card}, {rounded.none}, 448px max, full height, right edge, `shadow-2xl` |
| **Header** | Title only, in {typography.section-title} ink. No close ×, because Cancel does that job and one exit button is clearer. | Title in 16px bold + muted count "(4 items)", close × on the right. 16px × 20px padding, {colors.hairline-soft} bottom border. A status strip may follow (free-delivery progress). |
| **Body** | {typography.body-md} in {colors.body}, 8px under the title. Never scrolls; if it would, the content belongs in a drawer or page. | The **only** scrolling region. List rows separated by {colors.hairline-soft}, 16px vertical padding. The empty state replaces the body *and* footer. |
| **Footer** | Actions, 24px under the body, right-aligned, 12px gap: `button-ghost` (Cancel) then `button-primary` or `button-danger`. Below 640px both stretch to equal width. | Pinned to the bottom on {colors.surface-tint} with a {colors.hairline} top border. It holds the summary rows (Subtotal / discounts in sale red / Delivery / bold Total), a full-width `button-primary` at size lg, and a quiet text button for the secondary action (Clear cart). |

Spacing inside both follows the same rhythm: 24px around a dialog, 20px side padding in the drawer, and 12px between actions.

### Behavior contract

Every overlay must:
1. **Dim and block the page.** Show the scrim, and stop the page behind from scrolling while open.
2. **Close the same three ways.** Escape, a scrim click, and an explicit button (Cancel or ×). Never trap the customer.
3. **Let the topmost overlay own Escape.** With a dialog over the drawer, Escape closes only the dialog; the next Escape closes the drawer.
4. **Move focus in, and give it back.** Focus goes into the overlay on open (the safest action for destructive dialogs) and returns to the trigger on close.
5. **Be announced.** `role="dialog"` + `aria-modal`, labelled by the title.
6. **Animate in, not out.** Dialog: 150ms fade + 95→100% scale. Drawer: 300ms slide from the right (also on close, so it visibly returns to its edge).

### Stacking

Page (z-0) → header dropdowns → `cart-drawer` (fixed, z-50) → `dialog` (browser top layer, always above everything). Only one dialog may be open at a time.

## Responsive Behavior

| Name | Width | Key Changes |
|---|---|---|
| Mobile | < 640px | Search moves to its own full-width row; nav links collapse into MENU dropdown; banners stack; categories 4-up; product grid 2-up; hero headline 24px; cart label hidden (icon + badge only). |
| Tablet | 640–1023px | Search visible from 768px; banners side by side and hero headline 30px from 768px; categories 8-up from 768px; product grid 3-up; nav still collapsed. |
| Desktop | ≥ 1024px | Support phone number appears; full nav row with icons; "Recently Viewed" right-aligned; product rows 6-up; Top Saver + sign-up card split 3:1. |
| Wide | > 1184px | Content caps at 1152px; gray floor and white header stretch full width. |

### Touch Targets
- Cart pill buttons on cards are 32 × 32px. They're acceptable for dense product grids but below WCAG AAA (44px). On the product page, `add-button-lg` / `qty-stepper-lg` are 48px. Drawer Checkout is 44px+.
- Mobile menu rows are 44px+ tall (12px vertical padding plus 14px text and line height).

### Collapsing Strategy
- The nav never scrolls horizontally. Below 1024px, links move into a MENU dropdown panel that overlays the content.
- Grids drop columns (6 → 3 → 2) rather than shrinking cards.
- Banner text and photo stack vertically on mobile instead of overlapping.
- Dialog actions sit side by side; below 640px they stretch to equal widths so both stay easy to tap.

## Known Gaps

- Dark mode is intentionally not supported. The store renders one light canvas.
- Checkout and account pages are not designed yet. The homepage, product detail page, search results (which double as the category listing) and cart drawer exist.
- Search results have no loading skeleton. Pages render on the server, and `search-suggestions` keeps showing the previous results until new ones arrive.
- Each product has only one photo for now, so the `product-gallery` thumbnail row never shows in the live store yet.
- Reviews are a star average and a count only. There's no review list or write-a-review flow.
- Form error/success states and loading skeletons are not defined. The only toast is `cart-toast`.
- Carousel arrows and nav sub-menus are visual only. There are no slide or dropdown interaction specs.
- Photos are temporary Unsplash images, so art direction for real product shots (background, angle, lighting) is not yet defined.
- Motion beyond hover zoom and the overlay enter/exit animations is out of scope.
