# 📋 Farmart Online Grocery Store - Implementation Plan & Checklist

## 🎯 Business Goals & Objectives
- **เพิ่มยอดขาย:** อำนวยความสะดวกให้ลูกค้าค้นหา สั่งซื้อสินค้า และคำนวณส่วนลดได้ง่าย
- **ซื้อซ้ำ (Member Retention):** กระตุ้นให้สมัครสมาชิกและกลับมาซื้อด้วยส่วนลดพิเศษ (เช่น 15% สำหรับสมาชิกใหม่)
- **ลดภาระหน้าร้าน:** ให้ลูกค้าเลือกซื้อ คัดสรร และสรุปรายการสั่งซื้อผ่านระบบออนไลน์ได้เอง

---

## 🚀 Epic 1: Product Browsing & Category Navigation (ระบบค้นหาและหมวดหมู่สินค้า)
### 📖 Story 1.1: การค้นหาและกรองรายการสินค้า (Search & Filter)
- **Acceptance Criteria (AC):**
  - [ ] ลูกค้าสามารถค้นหาสินค้าด้วยคีย์เวิร์ด (เช่น ผัก, ผลไม้, นม) ผ่านช่อง Search ได้
  - [ ] ลูกค้าสามารถเลือกกรองสินค้าตามหมวดหมู่ได้ (ผัก/ผลไม้/เนื้อสัตว์/นม/เครื่องดื่ม ฯลฯ)
  - [ ] รายการสินค้าแสดงข้อมูลชัดเจน: รูปภาพ, ชื่อสินค้า, ราคาเต็ม, ราคาหลังส่วนลด, และคะแนนรีวิว (Rating)
- **SUBTASK Checklist:**
  - [ ] [FRONTEND] สร้าง Header Search Bar พร้อมระบบ Auto-complete / Live Filter
  - [ ] [FRONTEND] สร้างแถบเลือกหมวดหมู่สินค้า (Category Navigation Bar)
  - [ ] [FRONTEND] สร้างคอมโพเนนต์แสดงรายการสินค้า (Product Grid / List View) พร้อมระบบ Sorting (ตามราคา, คะแนนรีวิว)
  - [ ] [DATA/STATE] จัดเตรียม Mock Data / Data Schema ของสินค้า (ID, Name, Category, Price, Discount, Rating, Image)
  - [ ] [BACKEND] ออกแบบ Database Schema และ Data Model สำหรับสินค้า (Product) และหมวดหมู่ (Category)
  - [ ] [BACKEND] สร้าง REST API Endpoint สำหรับค้นหา กรองหมวดหมู่ และจัดเรียงรายการสินค้า (`GET /api/products`)
  - [ ] [BACKEND] สร้าง REST API Endpoint สำหรับดึงรายการหมวดหมู่สินค้าทั้งหมด (`GET /api/categories`)

---

## 🎨 Epic 2: Dynamic Homepage & Sales Boosters (หน้าแรกดึงดูด & โซนกระตุ้นยอดขาย)
### 📖 Story 2.1: Banner โปรโมชันและหมวดหมู่ยอดนิยม (Promotional Banner & Quick Categories)
- **Acceptance Criteria (AC):**
  - [ ] หน้าแรกแสดง Banner โปรโมชัน/ของลดราคาเด่นชัด ดึงดูดสายตา
  - [ ] มี Quick Category Cards ให้กดเลือกหมวดหมู่ได้ทันทีจากหน้าแรก
- **SUBTASK Checklist:**
  - [ ] [FRONTEND] ออกแบบและพัฒนา Hero Banner Slider/Carousel สำหรับแสดงโปรโมชันหลัก
  - [ ] [FRONTEND] พัฒนา Category Cards Highlight บนหน้าแรก
  - [ ] [BACKEND] ออกแบบ Database Schema / Data Model สำหรับ Banner โปรโมชัน
  - [ ] [BACKEND] สร้าง REST API Endpoint สำหรับดึงข้อมูล Banner โปรโมชันเด่น (`GET /api/banners`)
  - [ ] [BACKEND] สร้าง REST API Endpoint สำหรับดึงหมวดหมู่ยอดนิยมไฮไลท์ (`GET /api/categories/featured`)

### 📖 Story 2.2: โซนสินค้าขายดีและสินค้าประหยัด (Best Seller & Top Saver Sections)
- **Acceptance Criteria (AC):**
  - [ ] มี Section "Best Seller" สำหรับสินค้าขายดีประจำสัปดาห์/เดือน
  - [ ] มี Section "Top Saver" สำหรับสินค้าลดราคาพิเศษ/ประหยัดสูงสุด
  - [ ] ทุก Card สินค้ามีปุ่ม "หยิบใส่ตะกร้า" (Add to Cart) ให้ลูกค้ากดได้ทันทีโดยไม่ต้องเข้าหน้าอื่น
- **SUBTASK Checklist:**
  - [ ] [FRONTEND] พัฒนา Product Card Component (แสดง Badge ส่วนลด %, Rating Stars, ราคาเดิม vs ราคาโปรโมชัน)
  - [ ] [FRONTEND] สร้าง Carousel/Grid สำหรับ Section "Best Seller" และ "Top Saver"
  - [ ] [FRONTEND/STATE] เชื่อมต่อปุ่ม "หยิบใส่ตะกร้า" บน Card สินค้าเข้ากับ Cart State อัตโนมัติ
  - [ ] [BACKEND] สร้าง REST API Endpoint สำหรับดึงรายการสินค้าขายดี (`GET /api/products/bestsellers`)
  - [ ] [BACKEND] สร้าง REST API Endpoint สำหรับดึงรายการสินค้าประหยัดสูงสุด (`GET /api/products/top-savers`)

---

## 👤 Epic 3: Customer Membership & Loyalty (ระบบสมาชิกกระตุ้นการซื้อซ้ำ)
### 📖 Story 3.1: สิทธิประโยชน์สมาชิกใหม่ส่วนลด 15% (New Member Discount)
- **Acceptance Criteria (AC):**
  - [ ] แสดง Banner/Modal เชิญชวนสมัครสมาชิก "สมัครสมาชิกใหม่ รับส่วนลด 15%"
  - [ ] ลูกค้าสามารถกรอกฟอร์มสมัครสมาชิกใหม่ได้ง่ายและรวดเร็ว
  - [ ] สมาชิกใหม่ได้รับรหัสคูปองส่วนลด 15% ไปใช้อัตโนมัติในการสั่งซื้อ
- **SUBTASK Checklist:**
  - [ ] [FRONTEND] สร้าง Callout Banner / Pop-up Modal สำหรับสมัครสมาชิก
  - [ ] [FRONTEND] สร้าง Form สมัครสมาชิก (ชื่อ, อีเมล/เบอร์โทรศัพท์, รหัสผ่าน)
  - [ ] [STATE/LOGIC] จัดเก็บสถานะการเป็นสมาชิก (Member State) และ Promo Code (ส่วนลด 15%)
  - [ ] [BACKEND] ออกแบบ Database Schema สำหรับ User/Member และ Coupon/Promotion
  - [ ] [BACKEND] พัฒนา Registration & Authentication API (`POST /api/auth/register`, `POST /api/auth/login`) พร้อม Password Hashing และ JWT/Session Token
  - [ ] [BACKEND] พัฒนา API สำหรับออกคูปองและตรวจสอบสิทธิ์ส่วนลด 15% สำหรับสมาชิกใหม่ (`POST /api/coupons/validate`)

---

## 🛒 Epic 4: Shopping Cart & Order Summary (ระบบจัดการตะกร้าสินค้า)
### 📖 Story 4.1: ตะกร้าสินค้าและการคำนวณราคาสุทธิ (Cart Management & Total Summary)
- **Acceptance Criteria (AC):**
  - [ ] แสดงจำนวนสินค้าสะสมบนไอคอนตะกร้าสินค้า (Cart Badge)
  - [ ] ลูกค้าสามารถเปิดดูรายละเอียดตะกร้าสินค้า (Cart Drawer หรือ Cart Page) ได้ทุกเมื่อ
  - [ ] ลูกค้าสามารถ เพิ่ม/ลด จำนวนสินค้า หรือ ลบรายการสินค้าออกจากตะกร้าได้
  - [ ] ระบบคำนวณราคารวม, ส่วนลดสินค้า, ส่วนลดสมาชิก 15% (ถ้ามี) และยอดรวมสุทธิอย่างถูกต้องก่อนกดสั่งซื้อ
- **SUBTASK Checklist:**
  - [ ] [FRONTEND] พัฒนา Cart Drawer / Cart Sidebar Component
  - [ ] [STATE] เขียน Cart State Management (Add Item, Remove Item, Update Quantity, Clear Cart)
  - [ ] [LOGIC] คำนวณ Subtotal, Discount Amount, Member Discount, และ Grand Total
  - [ ] [FRONTEND] สร้าง Checkout Summary Card พร้อมปุ่ม "ยืนยันการสั่งซื้อ"
  - [ ] [BACKEND] ออกแบบ Database Schema สำหรับ Cart, Order และ Order Items
  - [ ] [BACKEND] พัฒนา API สำหรับจัดการตะกร้าสินค้าของสมาชิก (`GET/POST/PUT/DELETE /api/cart`)
  - [ ] [BACKEND] พัฒนา Server-side Calculation & Coupon Validation API เพื่อคำนวณยอดราคาสุทธิและความถูกต้องของส่วนลด
  - [ ] [BACKEND] พัฒนา Order Creation API Endpoint (`POST /api/orders`) สำหรับยืนยันการสั่งซื้อ บันทึกคำสั่งซื้อ และตัดสต็อกสินค้า
