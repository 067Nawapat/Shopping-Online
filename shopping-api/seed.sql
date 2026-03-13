USE shopping_db;

SET FOREIGN_KEY_CHECKS = 0;

DELETE FROM review_images;
DELETE FROM reviews;
DELETE FROM wishlist;
DELETE FROM cart;
DELETE FROM user_coupons;
DELETE FROM payments;
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM addresses;
DELETE FROM banners;
DELETE FROM variant_attributes;
DELETE FROM product_images;
DELETE FROM product_variants;
DELETE FROM products;
DELETE FROM coupons;
DELETE FROM categories;
DELETE FROM users;

ALTER TABLE users AUTO_INCREMENT = 1;
ALTER TABLE categories AUTO_INCREMENT = 1;
ALTER TABLE products AUTO_INCREMENT = 1;
ALTER TABLE product_variants AUTO_INCREMENT = 1;
ALTER TABLE product_images AUTO_INCREMENT = 1;
ALTER TABLE variant_attributes AUTO_INCREMENT = 1;
ALTER TABLE banners AUTO_INCREMENT = 1;
ALTER TABLE addresses AUTO_INCREMENT = 1;
ALTER TABLE coupons AUTO_INCREMENT = 1;
ALTER TABLE user_coupons AUTO_INCREMENT = 1;
ALTER TABLE reviews AUTO_INCREMENT = 1;
ALTER TABLE review_images AUTO_INCREMENT = 1;
ALTER TABLE orders AUTO_INCREMENT = 1;
ALTER TABLE order_items AUTO_INCREMENT = 1;
ALTER TABLE payments AUTO_INCREMENT = 1;
ALTER TABLE cart AUTO_INCREMENT = 1;

SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO users (id, name, email, password, avatar, gender, birth_date, google_id) VALUES
(1, 'Nawapat Admin', 'admin@example.com', '$2y$10$8h7Ncl8k2M3V7Q7dQeK0GODe5QdJ8F0fAqM4G.B6gQW7j6H6U9A2a', 'https://i.pravatar.cc/300?img=12', 'ชาย', '2000-03-10', NULL),
(2, 'Mint Customer', 'mint@example.com', '$2y$10$8h7Ncl8k2M3V7Q7dQeK0GODe5QdJ8F0fAqM4G.B6gQW7j6H6U9A2a', 'https://i.pravatar.cc/300?img=32', 'หญิง', '2001-08-22', NULL),
(3, 'Boss Tester', 'boss@example.com', '$2y$10$8h7Ncl8k2M3V7Q7dQeK0GODe5QdJ8F0fAqM4G.B6gQW7j6H6U9A2a', 'https://i.pravatar.cc/300?img=15', 'ชาย', '1998-01-05', NULL),
(4, 'Google Demo', 'google@example.com', '$2y$10$8h7Ncl8k2M3V7Q7dQeK0GODe5QdJ8F0fAqM4G.B6gQW7j6H6U9A2a', 'https://i.pravatar.cc/300?img=47', 'ไม่ระบุ', '1999-11-11', 'google-demo-id-001');

INSERT INTO categories (id, name) VALUES
(1, 'Sneakers'),
(2, 'Running'),
(3, 'Lifestyle'),
(4, 'Sandals'),
(5, 'Accessories');

INSERT INTO products (id, category_id, name, brand, description, sold) VALUES
(1, 1, 'Air Motion 90', 'Navi', 'รองเท้าแนวสตรีทสำหรับใส่ทุกวัน พื้นนุ่ม น้ำหนักเบา', 124),
(2, 2, 'Sprint Pro X', 'Volt', 'รองเท้าวิ่งระยะกลางถึงยาว ระบายอากาศดีและซัพพอร์ตดี', 89),
(3, 3, 'Cloud Street', 'Melo', 'รองเท้าไลฟ์สไตล์ทรงเรียบ จับคู่เสื้อผ้าง่าย', 63),
(4, 4, 'Wave Slide', 'Coast', 'รองเท้าแตะแบบสวม พื้นหนานุ่ม กันลื่น', 47),
(5, 1, 'Court Classic', 'Mono', 'สนีกเกอร์ทรงคลาสสิกสำหรับใช้งานประจำวัน', 71),
(6, 5, 'Crew Socks Pack', 'Navi', 'ถุงเท้ากีฬาแพ็ก 3 คู่ เนื้อผ้านุ่มและยืดหยุ่น', 152);

INSERT INTO product_variants (id, product_id, price, stock, sku) VALUES
(1, 1, 3290.00, 15, 'AM90-BLK-41'),
(2, 1, 3290.00, 12, 'AM90-WHT-42'),
(3, 2, 2890.00, 18, 'SPRX-BLU-41'),
(4, 2, 2890.00, 9,  'SPRX-GRY-42'),
(5, 3, 2590.00, 14, 'CLST-BEI-40'),
(6, 3, 2590.00, 8,  'CLST-BLK-41'),
(7, 4, 890.00, 25,  'WVSD-BLK-40'),
(8, 4, 890.00, 20,  'WVSD-CRM-41'),
(9, 5, 2190.00, 11, 'CRTC-WHT-41'),
(10, 5, 2190.00, 10, 'CRTC-GRN-42'),
(11, 6, 390.00, 50, 'CRSO-WHT-FREE'),
(12, 6, 390.00, 46, 'CRSO-MIX-FREE');

INSERT INTO variant_attributes (variant_id, attribute_name, attribute_value) VALUES
(1, 'size', '41'),
(1, 'color', 'Black'),
(2, 'size', '42'),
(2, 'color', 'White'),
(3, 'size', '41'),
(3, 'color', 'Blue'),
(4, 'size', '42'),
(4, 'color', 'Gray'),
(5, 'size', '40'),
(5, 'color', 'Beige'),
(6, 'size', '41'),
(6, 'color', 'Black'),
(7, 'size', '40'),
(7, 'color', 'Black'),
(8, 'size', '41'),
(8, 'color', 'Cream'),
(9, 'size', '41'),
(9, 'color', 'White'),
(10, 'size', '42'),
(10, 'color', 'Green'),
(11, 'size', 'FREE'),
(11, 'color', 'White'),
(12, 'size', 'FREE'),
(12, 'color', 'Mixed');

INSERT INTO product_images (product_id, image_url) VALUES
(1, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80'),
(1, 'https://images.unsplash.com/photo-1543508282-6319a3e2621f?auto=format&fit=crop&w=900&q=80'),
(2, 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=900&q=80'),
(2, 'https://images.unsplash.com/photo-1605348532760-6753d2c43329?auto=format&fit=crop&w=900&q=80'),
(3, 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=900&q=80'),
(3, 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=900&q=80'),
(4, 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=900&q=80'),
(5, 'https://images.unsplash.com/photo-1514989940723-e8e51635b782?auto=format&fit=crop&w=900&q=80'),
(6, 'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?auto=format&fit=crop&w=900&q=80');

INSERT INTO banners (title, subtitle, image, product_id, status) VALUES
('New Drop', 'รองเท้าคอลเลกชันใหม่ประจำสัปดาห์', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1400&q=80', 1, 'active'),
('Running Ready', 'รุ่นแนะนำสำหรับสายวิ่ง', 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=1400&q=80', 2, 'active'),
('Lifestyle Picks', 'ใส่ง่าย แมตช์ง่าย ทุกวัน', 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=1400&q=80', 3, 'active');

INSERT INTO addresses (user_id, full_name, phone, province, district, address_detail, is_default) VALUES
(2, 'Mint Customer', '0891112233', 'Bangkok', 'Chatuchak', '25/14 Phahonyothin Road, Lat Yao', 1),
(2, 'Mint Customer', '0891112233', 'Nonthaburi', 'Mueang', '89/9 Rattanathibet Road', 0),
(3, 'Boss Tester', '0812223344', 'Chiang Mai', 'Mueang', '12 Nimman Soi 5', 1);

INSERT INTO coupons (id, code, discount, expiry_date, status, max_discount, quantity) VALUES
(1, 'WELCOME10', 10.00, '2026-12-31', 'active', 150.00, 100),
(2, 'RUN500', 500.00, '2026-10-31', 'active', 500.00, 30),
(3, 'FREE50', 50.00, '2026-09-30', 'active', 50.00, 60),
(4, 'VIP20', 20.00, '2026-12-31', 'active', 400.00, 15);

INSERT INTO user_coupons (id, user_id, coupon_id, used, claimed_at) VALUES
(1, 2, 1, 0, '2026-03-10 10:00:00'),
(2, 2, 2, 1, '2026-03-08 14:35:00'),
(3, 2, 3, 0, '2026-03-09 16:20:00'),
(4, 3, 4, 0, '2026-03-11 09:15:00');

INSERT INTO cart (id, user_id, variant_id, quantity, created_at) VALUES
(1, 2, 3, 1, '2026-03-12 12:10:00'),
(2, 2, 11, 2, '2026-03-12 12:11:00'),
(3, 3, 9, 1, '2026-03-12 18:45:00');

INSERT INTO wishlist (user_id, product_id) VALUES
(2, 1),
(2, 5),
(3, 2),
(3, 3);

INSERT INTO reviews (id, product_id, user_id, rating, comment, created_at) VALUES
(1, 1, 2, 5, 'ทรงสวย ใส่สบายกว่าที่คิด พื้นเด้งดีมาก', '2026-03-01 11:00:00'),
(2, 2, 3, 4, 'วิ่งได้ดี น้ำหนักเบา แต่หน้าเท้าแคบนิดหน่อย', '2026-03-02 15:30:00'),
(3, 3, 2, 5, 'แมตช์กับเสื้อผ้าง่าย เหมาะกับใส่ทุกวัน', '2026-03-05 19:40:00'),
(4, 4, 1, 4, 'คุ้มราคา ใส่เดินในบ้านและข้างนอกได้สบาย', '2026-03-07 08:25:00');

INSERT INTO review_images (review_id, image_url) VALUES
(1, 'https://images.unsplash.com/photo-1543508282-6319a3e2621f?auto=format&fit=crop&w=900&q=80'),
(2, 'https://images.unsplash.com/photo-1605348532760-6753d2c43329?auto=format&fit=crop&w=900&q=80'),
(3, 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=900&q=80');

INSERT INTO orders (id, user_id, status, total_price, payment_method, created_at) VALUES
(1, 2, 'pending', 2890.00, 'promptpay', '2026-03-13 09:10:00'),
(2, 2, 'waiting', 390.00, 'true_money', '2026-03-12 20:15:00'),
(3, 3, 'completed', 2190.00, 'promptpay', '2026-03-11 13:00:00'),
(4, 2, 'rejected', 3290.00, 'promptpay', '2026-03-10 17:45:00');

INSERT INTO order_items (order_id, variant_id, quantity, price, created_at) VALUES
(1, 3, 1, 2890.00, '2026-03-13 09:10:00'),
(2, 11, 1, 390.00, '2026-03-12 20:15:00'),
(3, 9, 1, 2190.00, '2026-03-11 13:00:00'),
(4, 1, 1, 3290.00, '2026-03-10 17:45:00');

INSERT INTO payments (order_id, payment_method, amount, slip_image, provider_ref, slip_hash, status, created_at) VALUES
(2, 'true_money', 390.00, '1741833412_sample_truewallet.jpg', 'TMWALLET-REF-0001', 'HASH_TRUEWALLET_0001', 'waiting', '2026-03-12 20:20:00'),
(3, 'promptpay', 2190.00, '1741834412_sample_promptpay.jpg', 'PPAY-REF-0001', 'HASH_PROMPTPAY_0001', 'confirmed', '2026-03-11 13:05:00');
