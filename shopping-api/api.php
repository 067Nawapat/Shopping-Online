<?php

require __DIR__ . '/config/app.php';
require __DIR__ . '/helpers/response.php';
require __DIR__ . '/helpers/payment_utils.php';
require __DIR__ . '/helpers/easyslip.php';

$action = $_GET['action'] ?? '';

if (in_array($action, [
    'get_products', 'get_product', 'get_product_detail',
    'get_product_images', 'get_product_variants',
    'get_reviews', 'add_review', 'search_products',
])) {
    require __DIR__ . '/routes/products.php';

} elseif (in_array($action, [
    'add_to_cart', 'get_cart', 'remove_from_cart', 'clear_cart',
])) {
    require __DIR__ . '/routes/cart.php';

} elseif (in_array($action, [
    'get_banners', 'get_categories',
])) {
    require __DIR__ . '/routes/catalog.php';

} elseif (in_array($action, [
    'register', 'login', 'google_login', 'update_profile',
])) {
    require __DIR__ . '/routes/auth.php';

} elseif (in_array($action, [
    'toggle_wishlist', 'get_wishlist',
    'save_address', 'get_addresses', 'update_address', 'delete_address', 'set_default_address',
])) {
    require __DIR__ . '/routes/users.php';

} elseif (in_array($action, [
    'get_coupons', 'claim_coupon', 'get_user_coupons',
])) {
    require __DIR__ . '/routes/coupons.php';

} elseif (in_array($action, [
    'get_orders', 'create_order',
])) {
    require __DIR__ . '/routes/orders.php';

} elseif (in_array($action, [
    'generate_payment_qr', 'upload_slip',
])) {
    require __DIR__ . '/routes/payments.php';

} elseif ($action === 'track_shipment') {
    require __DIR__ . '/routes/shipments.php';

} else {
    json_response(["status" => "error", "message" => "Action not found"], 404);
}

$conn->close();
