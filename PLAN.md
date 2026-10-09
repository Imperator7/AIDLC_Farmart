# 📋 Farmart Online Grocery Store - Implementation Plan & Checklist

## 📊 Status (2026-10-09)

| Epic | Status |
|---|---|
| 1. Product Browsing & Category Navigation | ✅ Done |
| 2. Dynamic Homepage & Sales Boosters | 🟡 All but one item: the hero banner is a single static banner, not a slider |
| 3. Customer Membership & Loyalty | 🟡 UI only: the signup card and form are on the home page, nothing behind them |
| 4. Shopping Cart & Order Summary | 🟡 Browser cart only (localStorage); no server cart, member discount or orders |

- `[x]` done · `[ ]` not done · 🟡 partly done (the note says what is missing).
- What each built feature reads, and how: `/on-boarding`. API endpoints still to build: unmarked in `openapi.yaml` (no ✓), visible at `/docs`.
- Security work due with Epic 3 (from the 2026-10-09 review): rate-limit `/api/auth/login` and `register` (`RATE_LIMITED` is in the spec), and replace `script-src 'unsafe-inline'` in the CSP with nonces. With Epic 4: checkout prices the order on the server; the browser cart's prices can be edited (`src/lib/cart.ts`).
- Not in this plan but in `openapi.yaml`: wishlist (`/api/wishlist`) and related products (`/api/products/{id}/related`). The product page (`/products/[id]`) still reads `src/data` directly, not SQLite.

---

## 🎯 Business Goals & Objectives
- **เพิ่มยอดขาย:** อำนวยความสะดวกให้ลูกค้าค้นหา สั่งซื้อสินค้า และคำนวณส่วนลดได้ง่าย
- **ซื้อซ้ำ (Member Retention):** กระตุ้นให้สมัครสมาชิกและกลับมาซื้อด้วยส่วนลดพิเศษ (เช่น 15% สำหรับสมาชิกใหม่)
- **ลดภาระหน้าร้าน:** ให้ลูกค้าเลือกซื้อ คัดสรร และสรุปรายการสั่งซื้อผ่านระบบออนไลน์ได้เอง

---

## 🚀 Epic 1: Product Browsing & Category Navigation (ระบบค้นหาและหมวดหมู่สินค้า) ✅
### 📖 Story 1.1: การค้นหาและกรองรายการสินค้า (Search & Filter)
- **Acceptance Criteria (AC):**
  - [x] ลูกค้าสามารถค้นหาสินค้าด้วยคีย์เวิร์ด (เช่น ผัก, ผลไม้, นม) ผ่านช่อง Search ได้
  - [x] ลูกค้าสามารถเลือกกรองสินค้าตามหมวดหมู่ได้ (ผัก/ผลไม้/เนื้อสัตว์/นม/เครื่องดื่ม ฯลฯ)
  - [x] รายการสินค้าแสดงข้อมูลชัดเจน: รูปภาพ, ชื่อสินค้า, ราคาเต็ม, ราคาหลังส่วนลด, และคะแนนรีวิว (Rating)
- **SUBTASK Checklist:**
  - [x] [FRONTEND] สร้าง Header Search Bar พร้อมระบบ Auto-complete / Live Filter (`search-bar.tsx`, `GET /api/search/suggestions`)
  - [x] [FRONTEND] สร้างแถบเลือกหมวดหมู่สินค้า (Category Navigation Bar) (category select in the header, filter chips on `/search`)
  - [x] [FRONTEND] สร้างคอมโพเนนต์แสดงรายการสินค้า (Product Grid / List View) พร้อมระบบ Sorting (ตามราคา, คะแนนรีวิว) (`/search`; sorts: relevance, price, rating, discount, newest, best selling)
  - [x] [DATA/STATE] จัดเตรียม Mock Data / Data Schema ของสินค้า (ID, Name, Category, Price, Discount, Rating, Image) (`src/data/`)
  - [x] [BACKEND] ออกแบบ Database Schema และ Data Model สำหรับสินค้า (Product) และหมวดหมู่ (Category) (`src/server/db/schema.ts`)
  - [x] [BACKEND] สร้าง REST API Endpoint สำหรับค้นหา กรองหมวดหมู่ และจัดเรียงรายการสินค้า (`GET /api/products`)
  - [x] [BACKEND] สร้าง REST API Endpoint สำหรับดึงรายการหมวดหมู่สินค้าทั้งหมด (`GET /api/categories`)

---

## 🎨 Epic 2: Dynamic Homepage & Sales Boosters (หน้าแรกดึงดูด & โซนกระตุ้นยอดขาย) 🟡
### 📖 Story 2.1: Banner โปรโมชันและหมวดหมู่ยอดนิยม (Promotional Banner & Quick Categories)
- **Acceptance Criteria (AC):**
  - [x] หน้าแรกแสดง Banner โปรโมชัน/ของลดราคาเด่นชัด ดึงดูดสายตา
  - [x] มี Quick Category Cards ให้กดเลือกหมวดหมู่ได้ทันทีจากหน้าแรก
- **SUBTASK Checklist:**
  - [ ] 🟡 [FRONTEND] ออกแบบและพัฒนา Hero Banner Slider/Carousel สำหรับแสดงโปรโมชันหลัก (built: one hero banner and one side promo, static; missing: sliding between several banners)
  - [x] [FRONTEND] พัฒนา Category Cards Highlight บนหน้าแรก
  - [x] [BACKEND] ออกแบบ Database Schema / Data Model สำหรับ Banner โปรโมชัน
  - [x] [BACKEND] สร้าง REST API Endpoint สำหรับดึงข้อมูล Banner โปรโมชันเด่น (`GET /api/banners`)
  - [x] [BACKEND] สร้าง REST API Endpoint สำหรับดึงหมวดหมู่ยอดนิยมไฮไลท์ (`GET /api/categories/featured`)

### 📖 Story 2.2: โซนสินค้าขายดีและสินค้าประหยัด (Best Seller & Top Saver Sections)
- **Acceptance Criteria (AC):**
  - [x] มี Section "Best Seller" สำหรับสินค้าขายดีประจำสัปดาห์/เดือน
  - [x] มี Section "Top Saver" สำหรับสินค้าลดราคาพิเศษ/ประหยัดสูงสุด (with a deal countdown)
  - [x] ทุก Card สินค้ามีปุ่ม "หยิบใส่ตะกร้า" (Add to Cart) ให้ลูกค้ากดได้ทันทีโดยไม่ต้องเข้าหน้าอื่น
- **SUBTASK Checklist:**
  - [x] [FRONTEND] พัฒนา Product Card Component (แสดง Badge ส่วนลด %, Rating Stars, ราคาเดิม vs ราคาโปรโมชัน) (`product-card.tsx`)
  - [x] [FRONTEND] สร้าง Carousel/Grid สำหรับ Section "Best Seller" และ "Top Saver"
  - [x] [FRONTEND/STATE] เชื่อมต่อปุ่ม "หยิบใส่ตะกร้า" บน Card สินค้าเข้ากับ Cart State อัตโนมัติ
  - [x] [BACKEND] สร้าง REST API Endpoint สำหรับดึงรายการสินค้าขายดี (`GET /api/products/bestsellers`)
  - [x] [BACKEND] สร้าง REST API Endpoint สำหรับดึงรายการสินค้าประหยัดสูงสุด (`GET /api/products/top-savers`)

---

## 👤 Epic 3: Customer Membership & Loyalty (ระบบสมาชิกกระตุ้นการซื้อซ้ำ) 🟡
### 📖 Story 3.1: สิทธิประโยชน์สมาชิกใหม่ส่วนลด 15% (New Member Discount)
- **Acceptance Criteria (AC):**
  - [x] แสดง Banner/Modal เชิญชวนสมัครสมาชิก "สมัครสมาชิกใหม่ รับส่วนลด 15%" (`SignupCard` on the home page)
  - [ ] 🟡 ลูกค้าสามารถกรอกฟอร์มสมัครสมาชิกใหม่ได้ง่ายและรวดเร็ว (the form is on the page; submitting it does nothing yet)
  - [ ] สมาชิกใหม่ได้รับรหัสคูปองส่วนลด 15% ไปใช้อัตโนมัติในการสั่งซื้อ
- **SUBTASK Checklist:**
  - [x] [FRONTEND] สร้าง Callout Banner / Pop-up Modal สำหรับสมัครสมาชิก
  - [ ] 🟡 [FRONTEND] สร้าง Form สมัครสมาชิก (ชื่อ, อีเมล/เบอร์โทรศัพท์, รหัสผ่าน) (built: email, password, re-type password fields; missing: name, phone, submit, validation)
  - [ ] [STATE/LOGIC] จัดเก็บสถานะการเป็นสมาชิก (Member State) และ Promo Code (ส่วนลด 15%)
  - [ ] [BACKEND] ออกแบบ Database Schema สำหรับ User/Member และ Coupon/Promotion
  - [ ] [BACKEND] พัฒนา Registration & Authentication API (`POST /api/auth/register`, `POST /api/auth/login`) พร้อม Password Hashing และ JWT/Session Token (designed in `openapi.yaml` with `logout` and `me`; not built)
  - [ ] [BACKEND] พัฒนา API สำหรับออกคูปองและตรวจสอบสิทธิ์ส่วนลด 15% สำหรับสมาชิกใหม่ (`POST /api/coupons/validate`) (designed in `openapi.yaml`; not built)

---

## 🛒 Epic 4: Shopping Cart & Order Summary (ระบบจัดการตะกร้าสินค้า) 🟡
### 📖 Story 4.1: ตะกร้าสินค้าและการคำนวณราคาสุทธิ (Cart Management & Total Summary)
- **Acceptance Criteria (AC):**
  - [x] แสดงจำนวนสินค้าสะสมบนไอคอนตะกร้าสินค้า (Cart Badge)
  - [x] ลูกค้าสามารถเปิดดูรายละเอียดตะกร้าสินค้า (Cart Drawer หรือ Cart Page) ได้ทุกเมื่อ
  - [x] ลูกค้าสามารถ เพิ่ม/ลด จำนวนสินค้า หรือ ลบรายการสินค้าออกจากตะกร้าได้
  - [ ] 🟡 ระบบคำนวณราคารวม, ส่วนลดสินค้า, ส่วนลดสมาชิก 15% (ถ้ามี) และยอดรวมสุทธิอย่างถูกต้องก่อนกดสั่งซื้อ (built: subtotal, product discounts, delivery fee and total, in the browser; missing: the member discount and a server-side check)
- **SUBTASK Checklist:**
  - [x] [FRONTEND] พัฒนา Cart Drawer / Cart Sidebar Component (`cart-drawer.tsx`)
  - [x] [STATE] เขียน Cart State Management (Add Item, Remove Item, Update Quantity, Clear Cart) (`cart-context.tsx`, saved in localStorage)
  - [ ] 🟡 [LOGIC] คำนวณ Subtotal, Discount Amount, Member Discount, และ Grand Total (all but Member Discount)
  - [ ] 🟡 [FRONTEND] สร้าง Checkout Summary Card พร้อมปุ่ม "ยืนยันการสั่งซื้อ" (the drawer shows the summary and a Checkout button; the button does nothing yet)
  - [ ] [BACKEND] ออกแบบ Database Schema สำหรับ Cart, Order และ Order Items
  - [ ] [BACKEND] พัฒนา API สำหรับจัดการตะกร้าสินค้าของสมาชิก (`GET/POST/PUT/DELETE /api/cart`) (designed in `openapi.yaml`, with `/api/cart/items`, `/merge` and `/coupon`; not built)
  - [ ] [BACKEND] พัฒนา Server-side Calculation & Coupon Validation API เพื่อคำนวณยอดราคาสุทธิและความถูกต้องของส่วนลด
  - [ ] [BACKEND] พัฒนา Order Creation API Endpoint (`POST /api/orders`) สำหรับยืนยันการสั่งซื้อ บันทึกคำสั่งซื้อ และตัดสต็อกสินค้า (designed in `openapi.yaml`, with order history, detail and cancel; not built)
