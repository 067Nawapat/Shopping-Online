CREATE DATABASE IF NOT EXISTS shopping_db CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE shopping_db;

DROP TABLE IF EXISTS addresses;
DROP TABLE IF EXISTS banners;
DROP TABLE IF EXISTS cart;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS coupons;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS product_images;
DROP TABLE IF EXISTS product_variants;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS review_images;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS user_coupons;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS variant_attributes;
DROP TABLE IF EXISTS wishlist;

CREATE TABLE users (
  id INT(11) NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  password VARCHAR(255) NOT NULL,
  avatar VARCHAR(255) DEFAULT NULL,
  gender ENUM('ชาย','หญิง','ไม่ระบุ') DEFAULT 'ไม่ระบุ',
  birth_date DATE DEFAULT NULL,
  role ENUM('user','admin') DEFAULT 'user',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  google_id VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE categories (
  id INT(11) NOT NULL AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE products (
  id INT(11) NOT NULL AUTO_INCREMENT,
  category_id INT(11) DEFAULT NULL,
  name VARCHAR(255) NOT NULL,
  brand VARCHAR(100) DEFAULT NULL,
  description TEXT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sold INT(11) DEFAULT 0,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE product_variants (
  id INT(11) NOT NULL AUTO_INCREMENT,
  product_id INT(11) NOT NULL,
  price DECIMAL(10,2) DEFAULT NULL,
  stock INT(11) DEFAULT 0,
  sku VARCHAR(50) DEFAULT NULL,
  PRIMARY KEY (id),
  KEY product_id (product_id),
  CONSTRAINT product_variants_ibfk_1 FOREIGN KEY (product_id) REFERENCES products (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE variant_attributes (
  id INT(11) NOT NULL AUTO_INCREMENT,
  variant_id INT(11) NOT NULL,
  attribute_name VARCHAR(50) DEFAULT NULL,
  attribute_value VARCHAR(100) DEFAULT NULL,
  PRIMARY KEY (id),
  KEY variant_id (variant_id),
  CONSTRAINT variant_attributes_ibfk_1 FOREIGN KEY (variant_id) REFERENCES product_variants (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE product_images (
  id INT(11) NOT NULL AUTO_INCREMENT,
  product_id INT(11) NOT NULL,
  image_url VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (id),
  KEY product_id (product_id),
  CONSTRAINT product_images_ibfk_1 FOREIGN KEY (product_id) REFERENCES products (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE banners (
  id INT(11) NOT NULL AUTO_INCREMENT,
  title VARCHAR(255) DEFAULT NULL,
  subtitle VARCHAR(255) DEFAULT NULL,
  image VARCHAR(500) DEFAULT NULL,
  product_id INT(11) DEFAULT NULL,
  status ENUM('active','inactive') DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE cart (
  id INT(11) NOT NULL AUTO_INCREMENT,
  user_id INT(11) NOT NULL,
  variant_id INT(11) NOT NULL,
  quantity INT(11) DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY user_variant (user_id, variant_id),
  KEY variant_id (variant_id),
  CONSTRAINT cart_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT cart_ibfk_2 FOREIGN KEY (variant_id) REFERENCES product_variants (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE coupons (
  id INT(11) NOT NULL AUTO_INCREMENT,
  code VARCHAR(20) NOT NULL,
  discount DECIMAL(10,2) NOT NULL,
  expiry_date DATE DEFAULT NULL,
  status ENUM('active','expired') DEFAULT 'active',
  max_discount DECIMAL(10,2) DEFAULT NULL,
  quantity INT(11) DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE user_coupons (
  id INT(11) NOT NULL AUTO_INCREMENT,
  user_id INT(11) DEFAULT NULL,
  coupon_id INT(11) DEFAULT NULL,
  used TINYINT(1) DEFAULT 0,
  claimed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE wishlist (
  user_id INT(11) NOT NULL,
  product_id INT(11) NOT NULL,
  PRIMARY KEY (user_id, product_id),
  KEY product_id (product_id),
  CONSTRAINT wishlist_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id),
  CONSTRAINT wishlist_ibfk_2 FOREIGN KEY (product_id) REFERENCES products (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE reviews (
  id INT(11) NOT NULL AUTO_INCREMENT,
  product_id INT(11) DEFAULT NULL,
  user_id INT(11) DEFAULT NULL,
  rating INT(11) DEFAULT NULL,
  comment TEXT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY product_id (product_id),
  CONSTRAINT reviews_ibfk_1 FOREIGN KEY (product_id) REFERENCES products (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE review_images (
  id INT(11) NOT NULL AUTO_INCREMENT,
  review_id INT(11) DEFAULT NULL,
  image_url VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (id),
  KEY review_id (review_id),
  CONSTRAINT review_images_ibfk_1 FOREIGN KEY (review_id) REFERENCES reviews (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE addresses (
  id INT(11) NOT NULL AUTO_INCREMENT,
  user_id INT(11) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  province VARCHAR(100) NOT NULL,
  district VARCHAR(100) NOT NULL,
  address_detail TEXT NOT NULL,
  is_default TINYINT(1) DEFAULT 0,
  PRIMARY KEY (id),
  KEY user_id (user_id),
  CONSTRAINT addresses_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE orders (
  id INT(11) NOT NULL AUTO_INCREMENT,
  user_id INT(11) NOT NULL,
  status ENUM('pending','waiting','verifying','rejected','shipping','cancelled','completed') DEFAULT 'pending',
  total_price DECIMAL(10,2) DEFAULT NULL,
  payment_method ENUM('promptpay','true_money') NOT NULL DEFAULT 'promptpay',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY user_id (user_id),
  CONSTRAINT orders_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE order_items (
  id INT(11) NOT NULL AUTO_INCREMENT,
  order_id INT(11) NOT NULL,
  variant_id INT(11) NOT NULL,
  quantity INT(11) DEFAULT 1,
  price DECIMAL(10,2) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_order_id (order_id),
  KEY idx_variant_id (variant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE payments (
  id INT(11) NOT NULL AUTO_INCREMENT,
  order_id INT(11) DEFAULT NULL,
  payment_method ENUM('promptpay','true_money') DEFAULT NULL,
  amount DECIMAL(10,2) DEFAULT NULL,
  slip_image VARCHAR(255) DEFAULT NULL,
  provider_ref VARCHAR(100) DEFAULT NULL,
  slip_hash VARCHAR(64) DEFAULT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_provider_ref (provider_ref),
  UNIQUE KEY uniq_slip_hash (slip_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS shipments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    tracking_number VARCHAR(50) NOT NULL,
    carrier VARCHAR(50) DEFAULT 'Thailand Post',
    status_code VARCHAR(10),
    status_description VARCHAR(255),
    location VARCHAR(100),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);