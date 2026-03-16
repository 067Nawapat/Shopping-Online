# Shopping Online

โปรเจกต์นี้เป็นระบบร้านค้าออนไลน์ที่สมบูรณ์แบบ แยกออกเป็น 2 ส่วนชัดเจน รองรับทั้งแอปพลิเคชันมือถือและระบบจัดการหลังบ้านผ่านหน้าเว็บ

- `shopping-online/` : แอปพลิเคชันมือถือสำหรับลูกค้า พัฒนาด้วย **React Native + Expo**
- `shopping-api/` : ระบบ API และระบบจัดการ (Admin Panel) พัฒนาด้วย **PHP + MySQL** รันบน XAMPP

---

## 🌟 ฟีเจอร์เด่นของโปรเจกต์

### ฝั่งแอปพลิเคชันลูกค้า (Mobile App)
- **ระบบสมาชิก:** สมัครสมาชิก, เข้าสู่ระบบ และรองรับ **Google Login**
- **การจัดการโปรไฟล์:** อัปเดตรูปภาพโปรไฟล์จาก Google อัตโนมัติ, แก้ไขข้อมูลส่วนตัว, วันเกิด และเพศ
- **เลือกซื้อสินค้า:** 
  - ค้นหาสินค้าแบบ Real-time (Search)
  - แยกหมวดหมู่สินค้า (Category)
  - รายละเอียดสินค้าพร้อมรูปภาพหลายมุมมอง
  - ระบบสิ่งที่อยากได้ (Wishlist)
  - ตะกร้าสินค้า (Cart) พร้อมเลือกไซซ์และสี
- **ระบบคำสั่งซื้อ:**
  - สร้างคำสั่งซื้อ (Order) พร้อมรองรับคูปองส่วนลด
  - เลือกวิธีชำระเงิน: **PromptPay (QR)** และ **TrueMoney Wallet**
  - อัปโหลดสลิปและตรวจสอบสลิปอัตโนมัติผ่าน **EasySlip API**
  - ติดตามสถานะพัสดุ (Tracking) เชื่อมต่อกับไปรษณีย์ไทย
  - **รีวิวสินค้า:** ให้คะแนนและรูปภาพ (จำกัด 1 รีวิว ต่อ 1 รายการสั่งซื้อ)
- **การแจ้งเตือน:** ระบบดึงข้อมูลการแจ้งเตือนจากฐานข้อมูลมาแสดงผลในแอป

### ฝั่งระบบจัดการ (PHP Admin Panel)
- **Dashboard:** สรุปยอดขายและสถิติต่างๆ
- **จัดการคำสั่งซื้อ:** ตรวจสอบสลิป, ยืนยันยอดเงิน, อัปเดตสถานะการจัดส่ง และใส่เลขพัสดุ
- **จัดการสินค้า:** เพิ่ม/แก้ไข/ลบ สินค้า, ราคา, สต็อก และรูปภาพสินค้า
- **จัดการคูปอง:** สร้างโค้ดส่วนลดกำหนดวันหมดอายุและจำนวนได้
- **จัดการแจ้งเตือน:** ส่งข่าวสารหรือโปรโมชันหาผู้ใช้ทุกคน (Push Logic Ready)
- **จัดการหมวดหมู่และแบนเนอร์:** ปรับแต่งหน้า Home ของแอปได้ผ่านหลังบ้าน

---

## 🛠 เทคโนโลยีที่ใช้

### Frontend (Mobile)
- **React Native (Expo SDK 55)**
- **React Navigation** (Stack & Tabs)
- **Axios** (API Client)
- **AsyncStorage** (Local Storage)
- **Expo Image Picker & File System**

### Backend (Server & API)
- **PHP 8.x**
- **MySQL / MariaDB**
- **cURL** (สำหรับการเชื่อมต่อ API ภายนอก)
- **EasySlip API** (ตรวจสอบสลิปธนาคาร)
- **Bootstrap 5** (สำหรับ Admin UI)

---

## 🚀 การติดตั้งและตั้งค่า

### 1. การเตรียมฐานข้อมูล (MySQL)
1. เปิด **phpMyAdmin** หรือ Tool จัดการฐานข้อมูลของคุณ
2. สร้างฐานข้อมูลชื่อ `shopping_db`
3. Import ไฟล์ `shopping-api/schema.sql` และตามด้วย `shopping-api/seed.sql` (สำหรับข้อมูลตัวอย่าง)

### 2. ตั้งค่าฝั่ง API (shopping-api)
1. นำโฟลเดอร์ `shopping-api` ไปวางใน `C:\xampp\htdocs\`
2. คัดลอกไฟล์ `local-config.example.php` เป็น `local-config.php`
3. ใส่ค่าจริงใน `local-config.php`:
   ```php
   return [
       'EASYSLIP_ACCESS_TOKEN' => 'โทเค็น_EASYSLIP_ของคุณ',
       'PROMPTPAY_NUMBER' => 'เบอร์_พร้อมเพย์_ของคุณ',
       'TRUE_MONEY_NUMBER' => 'เบอร์_วอลเล็ต_ของคุณ',
       'THAIPOST_TOKEN' => 'โทเค็น_ไปรษณีย์ไทย_ของคุณ',
   ];
   ```

### 3. ตั้งค่าฝั่งแอปมือถือ (shopping-online)
1. เข้าไปที่โฟลเดอร์โปรเจกต์: `cd shopping-online`
2. ติดตั้ง Library: `npm install`
3. แก้ไขไฟล์ `src/config/appConfig.js`:
   - เปลี่ยน `API_BASE_URL` ให้ตรงกับ IP เครื่องคอมพิวเตอร์ของคุณ (ตรวจสอบด้วยคำสั่ง `ipconfig`)
   - ตัวอย่าง: `http://192.168.1.50/shopping-api/`
4. รันแอป: `npx expo run:android` หรือ `npx expo start`

---

## 📂 โครงสร้างโฟลเดอร์ที่สำคัญ
- `shopping-api/admin/` : หน้าเว็บสำหรับผู้ดูแลระบบ
- `shopping-api/routes/` : ไฟล์ Logic แยกตามฟังก์ชัน (Auth, Products, Orders, Notifications)
- `shopping-online/src/screens/` : หน้าจอต่างๆ ในแอปมือถือ
- `shopping-online/src/api/apiService.js` : ศูนย์กลางการเชื่อมต่อ API ทั้งหมด

---

## 🔐 ความปลอดภัย
- รหัสผ่านผู้ใช้ถูกเข้ารหัสด้วย **BCRYPT**
- ระบบรองรับการตรวจสอบ Google ID Token เพื่อยืนยันตัวตนจริงจาก Google
- ข้อมูลลับเช่น API Keys ถูกแยกเก็บในไฟล์ `local-config.php` ซึ่งถูกกันไม่ให้ Push ขึ้น GitHub ผ่าน `.gitignore`

---

**พัฒนาโดย:** [067Nawapat](https://github.com/067Nawapat)
