# 📋 Farmart Online Grocery Store - MVP Plan & Checklist

## 📊 Status (2026-10-14)

The catalog is built and live on Vercel. The MVP adds what a customer needs to actually buy: an account, a checkout
priced on the server, PromptPay payment and order history; then an admin dashboard to run the store. The database
moves from SQLite to **PostgreSQL** (queried with **Drizzle ORM**, provider-neutral) first, because accounts and
orders must be written and kept, which a read-only SQLite file in the deployment can't do. The production target is
**AWS with RDS** (Phase 5); until then development runs on a local Postgres and the live demo on a hosted one.

| Phase | What | Status |
|---|---|---|
| 0 | Revised plan, database design, Phase 1 detailed plan, Supabase and state-management guides | 🟡 this PR |
| 1 | PostgreSQL foundation: Drizzle schema, migrations, seed, catalog on Postgres, deploy setup | [ ] |
| 2 | Accounts: register, login, logout, welcome coupon | [ ] |
| 3 | Checkout and orders: server pricing, PromptPay (mock), order history | [ ] |
| 4 | Admin dashboard: products, orders, content, sales summary | [ ] |
| 5 | Launch hardening and the move to AWS (RDS) | [ ] |

- `[x]` done · `[ ]` not done · 🟡 in progress.
- The database design is in [`docs/database-design.md`](docs/database-design.md); **Phase 1 in detail** (files, steps,
  environments, open questions) is in [`docs/phase-1-postgres.md`](docs/phase-1-postgres.md); how a hosted Postgres
  (Supabase, for the interim live demo) is set up is in [`docs/supabase-guide.md`](docs/supabase-guide.md); how the client manages state (TanStack Query and Zustand) is in
  [`docs/state-management.md`](docs/state-management.md).
- Each phase is its own branch and PR into `main`, and each endpoint starts in `openapi.yaml` (spec first, as today).

### Decisions (2026-10-14)

| Topic | Decision | Why |
|---|---|---|
| Database | PostgreSQL, **provider-neutral** (plain Postgres, configured only by `DATABASE_URL`, `DATABASE_SSL`, `DATABASE_POOL_MAX`). Local Docker Postgres for development; a hosted Postgres (Supabase free) for the live demo until AWS; **Amazon RDS** in production | Writes that last (users, orders); moving between providers is a URL change plus a data copy |
| Hosting target | **AWS, region Singapore (`ap-southeast-1`)**: either **A** a static frontend on S3 + CloudFront with the API on API Gateway + Lambda, or **B** the whole Next.js app on AWS with OpenNext; RDS in a private VPC behind RDS Proxy. **A or B is still open** (decided before Phase 5) | Phase 1 keeps both possible: all data access stays in `src/server/`, and the build reads no data |
| Data access | Drizzle ORM (`drizzle-orm` + `drizzle-kit` migrations), `postgres` driver | Typed schema in TypeScript, plain SQL migrations in git, SQL-first like today |
| Tests | PGlite (Postgres compiled to WebAssembly, in process) | Integration tests keep running without Docker or a network, one fresh database per test file like today |
| Auth | Our own: users and argon2id password hashes in Postgres, opaque session token in an `HttpOnly` cookie, its SHA-256 hash in `sessions` | Chosen over Supabase Auth to keep the whole flow in this codebase |
| Payment | PromptPay QR, **mock**: the order page shows a QR for the amount; an admin marks the order paid by hand | No payment provider in the MVP; the order flow is the same when a real one is added |
| Cart | The browser cart stays (localStorage). Checkout sends only product ids and quantities; the server prices everything | Server carts (`/api/cart`, `/merge`, `/coupon` in the spec) aren't needed to sell |
| Admin | Same app, `/admin`, for users with `role = 'admin'` | One deployment, one session system |
| Client state | **TanStack Query** for server data in client components (account, checkout quote, orders, every admin table); **Zustand** for browser-only state (the cart, drawer and toast); filters in the URL; Server Components stay the first choice for pages that only show data | Each kind of state gets the tool built for it; explained in [`docs/state-management.md`](docs/state-management.md) |

### Not in the MVP

Server-side cart and cart merge, wishlist, related products, card payments (Stripe), password reset and email
verification, hero banner slider, product reviews, address book (the address is typed at checkout and stored on the
order). The drafted endpoints for these stay in `openapi.yaml`, unmarked.

---

## 🎯 Business Goals & Objectives
- **เพิ่มยอดขาย:** อำนวยความสะดวกให้ลูกค้าค้นหา สั่งซื้อสินค้า และคำนวณส่วนลดได้ง่าย
- **ซื้อซ้ำ (Member Retention):** กระตุ้นให้สมัครสมาชิกและกลับมาซื้อด้วยส่วนลดพิเศษ (15% สำหรับสมาชิกใหม่)
- **ลดภาระหน้าร้าน:** ให้ลูกค้าเลือกซื้อ สั่งซื้อ และชำระเงินผ่านระบบออนไลน์ได้เอง และให้ร้านจัดการสินค้ากับคำสั่งซื้อได้จากหลังบ้าน

---

## ✅ Already built (before the MVP)

- **Epic 1, Product Browsing & Category Navigation:** search with suggestions, category filter, sorting, pages
  (`/search`, `GET /api/products`, `/api/categories`, `/api/search/suggestions`).
- **Epic 2, Dynamic Homepage & Sales Boosters:** banners, featured categories, Best Seller, Top Saver with a countdown,
  New Arrivals, add to cart from every card. Not done, and not in the MVP: the hero banner slider.
- **Epic 4 (part), Cart:** cart badge, drawer, add / change / remove, totals with delivery fee, saved in localStorage
  and checked on load (`src/lib/cart.ts`).
- **Delivery:** live on Vercel; e2e, smoke and contract tests; developer pages hidden in production.

---

## 🐘 Phase 1: PostgreSQL foundation (ย้ายฐานข้อมูลไป PostgreSQL)

Goal: the app does everything it does today, from Postgres instead of SQLite, in development, tests and the live demo.
**The detailed plan is [`docs/phase-1-postgres.md`](docs/phase-1-postgres.md)**: decisions D1–D10, the file layout, the
schema translation, environments, and seven steps (1.1–1.7), each its own PR.

- **Acceptance Criteria (AC):**
  - [ ] ทุกหน้าและทุก API ที่มีอยู่ทำงานเหมือนเดิม โดยอ่านข้อมูลจาก PostgreSQL
  - [ ] หน้า Product detail (`/products/[id]`) อ่านจากฐานข้อมูล ไม่ใช่ `src/data` (admin จะแก้สินค้าได้ใน Phase 4)
  - [ ] `npm run build` ไม่ต้องใช้ฐานข้อมูล และโค้ดไม่ผูกกับผู้ให้บริการใด (ย้ายไป RDS ได้ด้วยการเปลี่ยน env)
  - [ ] Migrate schema ได้ด้วยคำสั่งเดียว และ Live demo ยังใช้งานได้
- **Steps (details in the Phase 1 plan):**
  - [ ] 1.1 Tooling: dependencies, local Postgres (`compose.yaml`), `drizzle.config.ts`, `db:*` scripts
  - [ ] 1.2 Schema and migrations: `src/server/db/schema/catalog.ts`, `drizzle/`, ER diagram check
  - [ ] 1.3 Test harness on PGlite and the seed on Drizzle
  - [ ] 1.4 Queries: `createCatalog(db)`, async, same JSON (contract and route tests unchanged)
  - [ ] 1.5 App wiring: connection, pages render on request, product page on the database, SQLite removed
  - [ ] 1.6 e2e and smoke on their own Postgres
  - [ ] 1.7 Docs, skills, `/on-boarding`, and the live demo on a hosted Postgres

---

## 👤 Phase 2: Accounts (สมัครสมาชิก / เข้าสู่ระบบ) — Epic 3

### 📖 Story 2.1: สมัครสมาชิกและรับคูปอง 15% (Register & Welcome Coupon)
- **Acceptance Criteria (AC):**
  - [x] แสดง Banner เชิญชวนสมัครสมาชิก "สมัครสมาชิกใหม่ รับส่วนลด 15%" (`SignupCard` on the home page)
  - [ ] ลูกค้ากรอกฟอร์มสมัคร (ชื่อ, อีเมล, เบอร์โทร, รหัสผ่าน) แล้วเข้าสู่ระบบทันที
  - [ ] สมาชิกใหม่ได้คูปอง `WELCOME15` (ลด 15%) ใช้ได้ครั้งเดียวกับคำสั่งซื้อแรก
  - [ ] อีเมลซ้ำได้ข้อความชัดเจน (`EMAIL_TAKEN`) และรหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร
- **SUBTASK Checklist:**
  - [ ] [BACKEND] Tables `users`, `sessions`, `coupons`, `coupon_redemptions`, `rate_limits` (design doc)
  - [ ] [BACKEND] `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` (already drafted in `openapi.yaml`)
  - [ ] [BACKEND] argon2id hashing (`@node-rs/argon2`), 32-byte random session token, cookie `HttpOnly; Secure; SameSite=Lax`, 30-day expiry; only the token's SHA-256 is stored
  - [ ] [BACKEND] Rate limit register and login per IP and per email (`RATE_LIMITED`, 429)
  - [ ] [STATE] State foundation: `QueryClientProvider`, `apiFetch` (throws a typed `ApiProblem`), query key factory, Query DevTools in development; `useMe()` for the header
  - [ ] [STATE] Move the cart from `cart-context.tsx` (context + reducer) to a Zustand store with `persist` (`sanitizeCart` on read, `version`, `skipHydration`); drawer and toast in a small UI store; same e2e tests stay green
  - [ ] [FRONTEND] Finish the sign-up form (name, phone, submit, errors); login page; account menu in the header; sign out
  - [ ] [TEST] Integration tests per status; e2e: register → signed in → sign out → sign in

---

## 🛒 Phase 3: Checkout & Orders (ชำระเงินและคำสั่งซื้อ) — Epic 4

### 📖 Story 3.1: สั่งซื้อและชำระเงินด้วย PromptPay (Checkout with PromptPay)
- **Acceptance Criteria (AC):**
  - [ ] ระบบคำนวณราคารวม, ส่วนลดสินค้า, ส่วนลดสมาชิก 15% (ถ้ามี), ค่าส่ง และยอดสุทธิ **บน server** ก่อนกดสั่งซื้อ
  - [ ] ลูกค้าต้องเข้าสู่ระบบก่อนสั่งซื้อ (ตะกร้าในเบราว์เซอร์ยังอยู่หลัง login)
  - [ ] กรอกที่อยู่จัดส่ง แล้วกด "ยืนยันการสั่งซื้อ" ได้คำสั่งซื้อสถานะ "รอชำระเงิน" พร้อม QR PromptPay ตามยอด
  - [ ] สต็อกถูกตัดตอนสั่งซื้อ และคืนเมื่อยกเลิก; สินค้าไม่พอได้ข้อความบอกรายการที่ขาด (`OUT_OF_STOCK`)
  - [ ] กดซ้ำ (double click / retry) ไม่ได้คำสั่งซื้อซ้ำ (`Idempotency-Key`)
- **SUBTASK Checklist:**
  - [ ] [BACKEND] Tables `orders`, `order_items`, `order_events` (design doc)
  - [ ] [BACKEND] `POST /api/checkout/quote`: prices `{ productId, qty }[]` plus an optional coupon for the signed-in user; the drawer and checkout page show this, not browser math
  - [ ] [BACKEND] `POST /api/orders`: one transaction: re-price, check and redeem the coupon, lock and decrement stock, insert order, items and the first event; idempotent per user and key
  - [ ] [BACKEND] Update `openapi.yaml`: `PaymentMethod` becomes `promptpay`; statuses `awaiting_payment → paid → packing → out_for_delivery → delivered`, or `cancelled`; add `/api/checkout/quote`
  - [ ] [FRONTEND] Checkout page (`/checkout`): address form, server-priced summary, coupon line, place order; the drawer's Checkout button leads here
  - [ ] [FRONTEND] Order page (`/orders/[id]`): PromptPay QR for the amount (EMVCo payload, generated in `src/lib/`), status timeline; clears the browser cart after the order is placed

### 📖 Story 3.2: ประวัติคำสั่งซื้อ (Order History)
- **Acceptance Criteria (AC):**
  - [ ] ลูกค้าดูรายการคำสั่งซื้อของตัวเองและรายละเอียดแต่ละรายการได้ (ไม่เห็นของคนอื่น: 404)
  - [ ] ยกเลิกคำสั่งซื้อได้เมื่อยัง "รอชำระเงิน"
- **SUBTASK Checklist:**
  - [ ] [BACKEND] `GET /api/orders`, `GET /api/orders/{id}`, `POST /api/orders/{id}/cancel` (drafted in the spec)
  - [ ] [FRONTEND] `/orders` list and the detail page
  - [ ] [TEST] Integration: pricing rules, coupon once only, stock never negative under two parallel orders, idempotency; e2e: cart → checkout → order page → cancel

---

## 🛠️ Phase 4: Admin Dashboard (หลังบ้านสำหรับร้าน)

### 📖 Story 4.1: จัดการสินค้าและสต็อก (Products)
- **Acceptance Criteria (AC):**
  - [ ] เฉพาะผู้ใช้ `role = 'admin'` เข้า `/admin` และ `/api/admin/*` ได้ (คนอื่นได้ 404)
  - [ ] เพิ่ม / แก้ไข / ซ่อนสินค้า, ราคา, ราคาเดิม, สต็อก, หมวดหมู่, รูป และรายละเอียด
### 📖 Story 4.2: จัดการคำสั่งซื้อ (Orders)
  - [ ] ดูคำสั่งซื้อทั้งหมด กรองตามสถานะ, กด "ยืนยันชำระเงินแล้ว" และเปลี่ยนสถานะจนถึงส่งสำเร็จ หรือยกเลิก (คืนสต็อก)
  - [ ] ทุกการเปลี่ยนสถานะถูกบันทึกว่าใครทำเมื่อไร (`order_events`)
### 📖 Story 4.3: จัดการเนื้อหาหน้าร้าน (Content)
  - [ ] แก้ Banner (ข้อความ, รูป, ลิงก์, ช่วงเวลาแสดง), หมวดหมู่ (ลำดับ, featured) และสินค้า Top Saver ของวัน
### 📖 Story 4.4: สรุปยอดขาย (Sales Summary)
  - [ ] หน้าแรกของ admin: ยอดขายวันนี้ / 7 วัน, จำนวนคำสั่งซื้อตามสถานะ, สินค้าใกล้หมด
- **SUBTASK Checklist:**
  - [ ] [BACKEND] `requireAdmin()` in `src/server/auth.ts`; `/api/admin/products`, `/orders`, `/banners`, `/categories`, `/deals`, `/summary` (spec first)
  - [ ] [BACKEND] `npm run admin:create -- --email …` promotes a user (no admin sign-up in the app)
  - [ ] [FRONTEND] `/admin` layout and pages; forms through the design system
  - [ ] [STATE] Admin tables on TanStack Query: filters and page in the URL, first page prefetched on the server (`HydrationBoundary`), mutations invalidate the list, the detail and the summary
  - [ ] [TEST] Every admin route refuses a customer and a guest; e2e for one product edit and one order status change

---

## 🔒 Phase 5: Launch hardening and the move to AWS

Before this phase: choose hosting **A** (S3 + CloudFront frontend, API Gateway + Lambda API) or **B** (OpenNext), and
write its detailed plan (`docs/phase-5-aws.md`) the way Phase 1 has one.

- [ ] Infrastructure as code (CDK, SST or Terraform) in the repo: VPC, RDS Postgres in private subnets, RDS Proxy,
      Secrets Manager for the password, the app (A or B), CloudFront with `/api/*` on the same domain (first-party
      cookies, no CORS)
- [ ] Data moved from the interim hosted Postgres to RDS (`pg_dump` / `pg_restore`), migrations run, `DATABASE_SSL=require`
- [ ] Replace `script-src 'unsafe-inline'` with nonces (needed now that there are sessions)
- [ ] CSRF: state-changing routes accept only same-origin requests (check `Origin`) in addition to `SameSite=Lax`
- [ ] `npm run smoke` and e2e cover sign-in, checkout and admin on the production build
- [ ] Backups (RDS automated backups and a restore tested), secrets only in Secrets Manager, security groups that let
      only the app reach the database
- [ ] Update the README's live demo link to the production URL
