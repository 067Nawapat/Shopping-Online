# Shopping Online

โปรเจกต์นี้เป็นระบบร้านค้าออนไลน์ที่แยกออกเป็น 2 ส่วนชัดเจน

- `shopping-online/` สำหรับแอปมือถือฝั่งผู้ใช้ด้วย React Native + Expo
- `shopping-api/` สำหรับ PHP API ที่รันบน XAMPP และเชื่อมต่อ MySQL

README นี้อธิบายให้ครบว่าโปรเจกต์นี้ทำอะไรได้บ้าง ใช้อะไรบ้าง ติดตั้งอย่างไร ต้องแก้ค่าอะไรตรงไหน และสร้างฐานข้อมูลอย่างไร

## โปรเจกต์นี้ทำอะไรได้บ้าง

ระบบนี้รองรับ flow หลักของร้านค้าออนไลน์ดังนี้

- สมัครสมาชิก / เข้าสู่ระบบ
- เข้าสู่ระบบด้วย Google
- ดูสินค้า แยกหมวดหมู่ ค้นหา และดูรายละเอียดสินค้า
- ดูรูปสินค้า รีวิวสินค้า และตัวเลือกสินค้า เช่น ขนาด
- เพิ่มสินค้าเข้าตะกร้า
- เพิ่ม / แก้ไข / ลบ ที่อยู่จัดส่ง
- เลือกคูปอง
- สร้างคำสั่งซื้อ
- เลือกวิธีชำระเงิน
- รองรับการชำระแบบ `PromptPay`
- รองรับการชำระแบบ `TrueMoney Wallet`
- สร้าง QR PromptPay ผ่าน EasySlip
- อัปโหลดสลิปเพื่อตรวจสอบการชำระเงิน
- กันสลิปซ้ำ
- ปฏิเสธสลิปที่ยอดเงินหรือข้อมูลผู้รับไม่ตรง
- แสดงรายการออเดอร์ที่รอชำระ

## เทคโนโลยีที่ใช้

### ฝั่งแอป `shopping-online/`

- React Native
- Expo
- React Navigation
- Axios
- AsyncStorage
- Expo Image Picker
- Expo Media Library
- Expo File System

### ฝั่ง API `shopping-api/`

- PHP
- MySQL / MariaDB
- XAMPP
- cURL
- EasySlip API

## โครงสร้างโปรเจกต์

```text
Shopping-Online/
|- shopping-online/
|  |- App.js
|  |- package.json
|  |- assets/
|  |- src/
|     |- api/
|     |- config/
|     |- screens/
|     |- styles/
|     |- utils/
|
|- shopping-api/
|  |- api.php
|  |- schema.sql
|  |- local-config.example.php
|
|- .gitignore
|- README.md
```

## ไฟล์ที่ควรรู้ก่อนเริ่ม

### ฝั่งแอป

- [shopping-online/App.js](/D:/shopping-online/shopping-online/App.js)
- [shopping-online/package.json](/D:/shopping-online/shopping-online/package.json)
- [shopping-online/src/api/apiService.js](/D:/shopping-online/shopping-online/src/api/apiService.js)
- [shopping-online/src/config/appConfig.js](/D:/shopping-online/shopping-online/src/config/appConfig.js)
- [shopping-online/src/screens/CheckoutScreen.js](/D:/shopping-online/shopping-online/src/screens/CheckoutScreen.js)
- [shopping-online/src/screens/PaymentPromptPayScreen.js](/D:/shopping-online/shopping-online/src/screens/PaymentPromptPayScreen.js)

### ฝั่ง API

- [shopping-api/api.php](/D:/shopping-online/shopping-api/api.php)
- [shopping-api/schema.sql](/D:/shopping-online/shopping-api/schema.sql)
- [shopping-api/local-config.example.php](/D:/shopping-online/shopping-api/local-config.example.php)

## การติดตั้งฝั่งแอป `shopping-online/`

### 1. เข้าไปที่โฟลเดอร์แอป

```bash
cd shopping-online
```

### 2. ติดตั้ง dependencies

```bash
npm install
```

### 3. รันบน Android แบบที่โปรเจกต์นี้ใช้

```bash
npx expo run:android
```

หมายเหตุ:

- ต้องเปิด Android Emulator หรือเสียบมือถือ Android ที่เปิด USB Debugging ไว้ก่อน
- ถ้ายังไม่เคยเซ็ต Android Studio / Android SDK ให้ทำส่วนนั้นก่อน

## การติดตั้งฝั่ง API `shopping-api/`

### 1. นำโฟลเดอร์ API ไปวางใน XAMPP

ให้นำโฟลเดอร์ `shopping-api` ไปไว้ที่ path นี้

```text
C:\xampp\htdocs\shopping-api
```

สรุป path ที่ใช้งานจริงควรเป็นประมาณนี้

```text
C:\xampp\htdocs\shopping-api\api.php
```

### 2. เปิด XAMPP

ให้เปิด

- Apache
- MySQL

### 3. สร้างฐานข้อมูล

โปรเจกต์นี้ใช้ฐานข้อมูลชื่อ

```text
shopping_db
```

คุณสามารถสร้างฐานข้อมูลได้ 2 แบบ

#### แบบที่ 1: ใช้ phpMyAdmin

1. เข้า `http://localhost/phpmyadmin`
2. สร้างฐานข้อมูลชื่อ `shopping_db`
3. เลือกฐานข้อมูล `shopping_db`
4. ไปที่เมนู `Import`
5. เลือกไฟล์ [shopping-api/schema.sql](/D:/shopping-online/shopping-api/schema.sql)
6. กด Import

#### แบบที่ 2: ใช้คำสั่ง SQL ตรง ๆ

```sql
CREATE DATABASE IF NOT EXISTS shopping_db CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE shopping_db;
```

จากนั้นให้รันไฟล์ [shopping-api/schema.sql](/D:/shopping-online/shopping-api/schema.sql)

## โค้ดสร้างฐานข้อมูล

โปรเจกต์นี้มีไฟล์ schema เตรียมไว้แล้วที่:

- [shopping-api/schema.sql](/D:/shopping-online/shopping-api/schema.sql)

ไฟล์นี้ประกอบด้วยโค้ดสร้างตารางหลักทั้งหมด เช่น

- `users`
- `products`
- `product_variants`
- `product_images`
- `categories`
- `cart`
- `wishlist`
- `reviews`
- `review_images`
- `addresses`
- `coupons`
- `user_coupons`
- `orders`
- `order_items`
- `payments`
- `banners`
- `variant_attributes`

ถ้าต้องการสร้างใหม่ทั้งหมด ให้ import ไฟล์ `schema.sql` ได้เลย

## จุดที่ต้องแก้ก่อนใช้งานจริง

## 1. แก้ API URL ของแอป

ให้แก้ที่ไฟล์:

- [shopping-online/src/config/appConfig.js](/D:/shopping-online/shopping-online/src/config/appConfig.js)

ตอนนี้ค่าใน repo เป็นตัวอย่าง:

```js
export const APP_CONFIG = {
  API_BASE_URL: 'http://YOUR_LAN_IP/shopping-api/',
  PROMPTPAY_NUMBER: 'CHANGE_PROMPTPAY_NUMBER',
  TRUE_MONEY_NUMBER: 'CHANGE_TRUE_MONEY_NUMBER',
};
```

ให้เปลี่ยน `API_BASE_URL` ให้ตรงกับเครื่องที่รัน API

ตัวอย่าง:

- Android Emulator

```js
API_BASE_URL: 'http://10.0.2.2/shopping-api/'
```

- มือถือจริงในวง LAN

```js
API_BASE_URL: 'http://192.168.1.100/shopping-api/'
```

สำคัญ:

- ค่าใน `API_BASE_URL` ต้องลงท้ายด้วย `/`
- ตัวแอปจะต่อ path เป็น `api.php?action=...` เอง

## 2. แก้เบอร์ PromptPay และ TrueMoney Wallet

ฝั่งแอปต้องแก้ที่:

- [shopping-online/src/config/appConfig.js](/D:/shopping-online/shopping-online/src/config/appConfig.js)

ฝั่ง API ต้องแก้ที่:

- `shopping-api/local-config.php` หรือ environment variable

### วิธีตั้งค่าฝั่ง API แบบแนะนำ

คัดลอกไฟล์ตัวอย่าง:

- [shopping-api/local-config.example.php](/D:/shopping-online/shopping-api/local-config.example.php)

ให้เป็น:

```text
shopping-api/local-config.php
```

แล้วใส่ค่าจริงแบบนี้:

```php
<?php

return [
    'EASYSLIP_ACCESS_TOKEN' => 'YOUR_REAL_EASYSLIP_TOKEN',
    'PROMPTPAY_NUMBER' => 'YOUR_PROMPTPAY_NUMBER',
    'TRUE_MONEY_NUMBER' => 'YOUR_TRUE_MONEY_NUMBER',
];
```

ข้อสำคัญ:

- `shopping-api/local-config.php` ถูก ignore แล้ว
- ห้าม commit ไฟล์นี้ขึ้น GitHub

## 3. ตั้งค่า EasySlip token

ตั้งค่าได้ 2 วิธี

### วิธีที่แนะนำที่สุด

ตั้งเป็น environment variable ฝั่ง server:

```text
EASYSLIP_ACCESS_TOKEN=YOUR_REAL_EASYSLIP_TOKEN
```

### วิธี local แบบง่าย

ใส่ไว้ใน:

```text
shopping-api/local-config.php
```

## เบอร์ PromptPay และ Wallet ของคุณหลุดไปแล้วไหม

ถ้าหมายถึงเบอร์ที่เคยใส่ไว้ใน source code ก่อนหน้านี้ คำตอบคือ:

- ใช่ มีโอกาสถือว่า “หลุด” แล้ว ถ้าเคย push ขึ้น GitHub

ดังนั้นรอบนี้ผมแก้ให้แล้วโดย:

- เอาเบอร์ออกจากไฟล์หลักที่เคย hardcode
- ย้ายไปไว้ในจุด config ที่แก้ได้ง่าย
- เปลี่ยนค่าที่อยู่ใน repo ให้เป็น placeholder

คำแนะนำ:

1. เปลี่ยนเบอร์หรือใช้เบอร์ใหม่ถ้ากังวลเรื่องการนำไปใช้ต่อ
2. อย่า push เบอร์จริงและ token จริงขึ้น GitHub
3. ให้เก็บค่าจริงไว้ใน `local-config.php` หรือ environment variable เท่านั้น

## ค่า config ที่ระบบอ่านอยู่ตอนนี้

### ฝั่งแอป

- `API_BASE_URL`
- `PROMPTPAY_NUMBER`
- `TRUE_MONEY_NUMBER`

จากไฟล์:

- [shopping-online/src/config/appConfig.js](/D:/shopping-online/shopping-online/src/config/appConfig.js)

### ฝั่ง API

- `EASYSLIP_ACCESS_TOKEN`
- `PROMPTPAY_NUMBER`
- `TRUE_MONEY_NUMBER`

จาก:

- environment variable
- หรือ `shopping-api/local-config.php`

## ตัวอย่างลำดับการติดตั้งทั้งหมด

### 1. clone repo

```bash
git clone https://github.com/067Nawapat/Shopping-Online.git
cd Shopping-Online
```

### 2. ตั้งค่าฝั่ง API

1. คัดลอก `shopping-api` ไปไว้ที่ `C:\xampp\htdocs\shopping-api`
2. import ไฟล์ `shopping-api/schema.sql`
3. สร้าง `shopping-api/local-config.php`
4. ใส่ token และเบอร์ที่ใช้งานจริง

### 3. ตั้งค่าฝั่งแอป

1. เปิดไฟล์ `shopping-online/src/config/appConfig.js`
2. แก้ `API_BASE_URL`
3. แก้ `PROMPTPAY_NUMBER`
4. แก้ `TRUE_MONEY_NUMBER`

### 4. รันแอป

```bash
cd shopping-online
npm install
npx expo run:android
```

## การกันข้อมูลลับหลุดขึ้น GitHub

ตอนนี้ `.gitignore` กันไว้แล้วสำหรับ:

- `shopping-api/local-config.php`
- `shopping-api/uploads/`
- `shopping-online/node_modules/`
- `shopping-online/.expo/`
- `.env` ต่าง ๆ

ก่อน push ควรเช็กอย่างน้อย:

```bash
git status
git diff --cached
```

และควรเช็กว่าไม่มีข้อมูลพวกนี้อยู่ในไฟล์ที่กำลังจะ commit:

- EasySlip token
- เบอร์ PromptPay จริง
- เบอร์ TrueMoney Wallet จริง
- URL ภายในองค์กรหรือ IP ที่ไม่อยากเผยแพร่
- รูปสลิปจริงของลูกค้า

