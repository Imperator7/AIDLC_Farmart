# Critique ignore list

Findings matching these are dropped silently. Set by the user on 2026-10-06: "stop judging functionality that isn't implemented yet; focus on UI/UX only."

- Dead destinations: links to `#`, nav items, "Shop Now", "All x ›", category tiles and brand cards that go nowhere.
- Controls without behavior: carousel arrows (kept on purpose), search that doesn't search, Account/Wishlist buttons, "Shop by Category" button.
- Sign-up form: no submit, validation, error or success states.
- No undo after removing a cart item.
- Missing pages and flows: category listing, checkout, account, help pages.
- Mock data: placeholder brand names, the countdown resetting at midnight, sold counts.
- Eyebrow labels ("SUMMER FRESH", brand eyebrows): kept on purpose because they're in the user's reference design.
