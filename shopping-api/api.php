<?php

require __DIR__ . '/config/app.php';
require __DIR__ . '/helpers/response.php';
require __DIR__ . '/helpers/payment_utils.php';
require __DIR__ . '/helpers/easyslip.php';

$action = $_GET['action'] ?? '';

// สินค้า (Products, Reviews, Admin Product Management)
if (in_array($action, [
    'get_products', 'get_product', 'get_product_detail',
    'get_product_images', 'get_product_variants',
    'get_reviews', 'add_review', 'search_products',
    'admin_get_products', 'admin_save_product', 'admin_delete_product'
])) {
    require __DIR__ . '/routes/products.php';

// ตระกร้าสินค้า (Cart)
} elseif (in_array($action, [
    'add_to_cart', 'get_cart', 'remove_from_cart', 'clear_cart',
])) {
    require __DIR__ . '/routes/cart.php';

// แคตตาล็อก (Banners, Categories)
} elseif (in_array($action, [
    'get_banners', 'get_categories', 'admin_save_category', 'admin_get_dashboard_stats'
])) {
    require __DIR__ . '/routes/catalog.php';

// สมาชิกและการล็อกอิน (Auth)
} elseif (in_array($action, [
    'register', 'login', 'google_login', 'update_profile',
])) {
    require __DIR__ . '/routes/auth.php';

// ข้อมูลผู้ใช้ (Addresses, Wishlist)
} elseif (in_array($action, [
    'toggle_wishlist', 'get_wishlist',
    'save_address', 'get_addresses', 'update_address', 'delete_address', 'set_default_address',
])) {
    require __DIR__ . '/routes/users.php';

// คูปอง (Coupons)
} elseif (in_array($action, [
    'get_coupons', 'claim_coupon', 'get_user_coupons', 'admin_get_coupons', 'admin_save_coupon'
])) {
    require __DIR__ . '/routes/coupons.php';

// คำสั่งซื้อ (Orders)
} elseif (in_array($action, [
    'get_orders', 'create_order', 'admin_get_orders', 'admin_update_order_status'
])) {
    require __DIR__ . '/routes/orders.php';

// การชำระเงิน (Payments)
} elseif (in_array($action, [
    'generate_payment_qr', 'upload_slip',
])) {
    require __DIR__ . '/routes/payments.php';

// การจัดส่ง (Shipments)
} elseif ($action === 'track_shipment') {
    require __DIR__ . '/routes/shipments.php';

// การแจ้งเตือน (Notifications)
} elseif (in_array($action, [
    'get_notifications', 'save_push_token', 'admin_send_notification'
])) {
    require __DIR__ . '/routes/notifications.php';

} else {
    json_response(["status" => "error", "message" => "Action not found"], 404);
}

$conn->close();
