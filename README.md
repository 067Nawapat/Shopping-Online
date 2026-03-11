# Shopping Online

Repo นี้รวมทั้ง frontend และ backend:

- `shopping-online/` React Native Expo app
- `shopping-api/` PHP API สำหรับ XAMPP

## Structure

ใน workspace ปัจจุบัน root นี้คือ frontend app และมี backend อยู่ในโฟลเดอร์ `shopping-api/`

- `App.js` entry ของแอป
- `src/` screens, styles, api service
- `shopping-api/api.php` PHP API

## Frontend Setup

```bash
npm install
npm start
```

## Backend Setup

1. วางโฟลเดอร์นี้ไว้ใต้ `C:\xampp\htdocs\shopping-api` หรือ map ให้ web server เห็น path นี้
2. สร้างฐานข้อมูล `shopping_db`
3. เตรียมตาราง `users`, `products`, `coupons`, `addresses`
4. เปิด Apache และ MySQL ใน XAMPP

## API Base URL

frontend อ่านค่าจากไฟล์ `src/config/api.js`

ตัวอย่าง:

- Android emulator: `http://10.0.2.2/shopping-api/api.php`
- iOS simulator / web: `http://localhost/shopping-api/api.php`
- มือถือจริง: `http://YOUR_LAN_IP/shopping-api/api.php`

## Notes

- `shopping-api/api.php` ใช้ MySQL ชื่อ `shopping_db`
- ไม่ควร commit database dump หรือไฟล์ secret จริงขึ้น GitHub
