<?php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$conn = new mysqli("localhost", "root", "", "shopping_db");

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database connection failed"]);
    exit;
}

$conn->set_charset("utf8mb4");

$action = $_GET['action'] ?? '';

function json_response($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

function read_body() {
    return json_decode(file_get_contents("php://input"), true) ?? [];
}

function product_select_sql() {
    return "
        SELECT 
            p.*,
            COALESCE(
                (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.id ASC LIMIT 1),
                'https://via.placeholder.com/500'
            ) AS image,
            COALESCE(
                (SELECT MIN(pv.price) FROM product_variants pv WHERE pv.product_id = p.id),
                0
            ) AS price
        FROM products p
    ";
}

function parse_tlv_payload($payload) {
    $result = [];
    $length = strlen($payload);
    $cursor = 0;

    while ($cursor + 4 <= $length) {
        $tag = substr($payload, $cursor, 2);
        $valueLength = (int)substr($payload, $cursor + 2, 2);
        $valueStart = $cursor + 4;
        $value = substr($payload, $valueStart, $valueLength);
        $result[$tag] = $value;
        $cursor = $valueStart + $valueLength;
    }

    return $result;
}

function normalize_promptpay_target($value) {
    $digits = preg_replace('/\D+/', '', (string)$value);
    if (!$digits) {
        return '';
    }

    if (strlen($digits) >= 13 && substr($digits, 0, 3) === '006') {
        return substr($digits, 3);
    }

    return $digits;
}

function extract_promptpay_details($qrPayload) {
    if (!$qrPayload || !is_string($qrPayload)) {
        return ['promptpay' => '', 'amount' => null];
    }

    $parsed = parse_tlv_payload($qrPayload);
    $merchantAccount = $parsed['29'] ?? ($parsed['30'] ?? '');
    $merchantFields = $merchantAccount ? parse_tlv_payload($merchantAccount) : [];
    $promptpay = normalize_promptpay_target($merchantFields['01'] ?? '');
    $amount = isset($parsed['54']) && $parsed['54'] !== '' ? (float)$parsed['54'] : null;

    return [
        'promptpay' => $promptpay,
        'amount' => $amount,
    ];
}

function get_promptpay_target() {
    $value = trim((string)(getenv('PROMPTPAY_NUMBER') ?: ''));
    if ($value !== '') {
        return $value;
    }

    $localConfigPath = __DIR__ . '/local-config.php';
    if (is_file($localConfigPath)) {
        $config = require $localConfigPath;
        if (is_array($config) && !empty($config['PROMPTPAY_NUMBER'])) {
            return trim((string)$config['PROMPTPAY_NUMBER']);
        }
    }

    return '';
}

function get_truemoney_target() {
    $value = trim((string)(getenv('TRUE_MONEY_NUMBER') ?: ''));
    if ($value !== '') {
        return $value;
    }

    $localConfigPath = __DIR__ . '/local-config.php';
    if (is_file($localConfigPath)) {
        $config = require $localConfigPath;
        if (is_array($config) && !empty($config['TRUE_MONEY_NUMBER'])) {
            return trim((string)$config['TRUE_MONEY_NUMBER']);
        }
    }

    return '';
}

function payment_method_label($paymentMethod) {
    return $paymentMethod === 'true_money' ? 'true_money' : 'promptpay';
}

function trailing_digits($value, $length = 4) {
    $digits = preg_replace('/\D+/', '', (string)$value);
    if ($digits === '') {
        return '';
    }

    return strlen($digits) <= $length ? $digits : substr($digits, -$length);
}

function promptpay_values_match($detected, $expected) {
    $detected = normalize_promptpay_target($detected);
    $expected = normalize_promptpay_target($expected);

    if ($detected === '' || $expected === '') {
        return false;
    }

    if ($detected === $expected) {
        return true;
    }

    return str_ends_with($expected, $detected) || str_ends_with($detected, $expected);
}

function phone_values_match($detected, $expected) {
    $detected = preg_replace('/\D+/', '', (string)$detected);
    $expected = preg_replace('/\D+/', '', (string)$expected);

    if ($detected === '' || $expected === '') {
        return false;
    }

    if ($detected === $expected) {
        return true;
    }

    $detectedSuffix = trailing_digits($detected, 4);
    $expectedSuffix = trailing_digits($expected, 4);

    return $detectedSuffix !== '' && $detectedSuffix === $expectedSuffix;
}

function get_easyslip_token() {
    $token = trim((string)(getenv('EASYSLIP_ACCESS_TOKEN') ?: ''));
    if ($token !== '') {
        return $token;
    }

    $localConfigPath = __DIR__ . '/local-config.php';
    if (is_file($localConfigPath)) {
        $config = require $localConfigPath;
        if (is_array($config) && !empty($config['EASYSLIP_ACCESS_TOKEN'])) {
            return trim((string)$config['EASYSLIP_ACCESS_TOKEN']);
        }
    }

    return '';
}

function create_data_uri($base64, $mime = 'image/png') {
    return 'data:' . $mime . ';base64,' . $base64;
}

function easyslip_json_post($url, $payload) {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_TIMEOUT => 20,
    ]);

    $response = curl_exec($ch);
    $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    return [
        'http_code' => $httpCode,
        'body' => $response,
        'json' => $response ? json_decode($response, true) : null,
        'error' => $error,
    ];
}

function easyslip_verify_image($filePath, $token, $checkDuplicate = true) {
    $postFields = [
        'file' => new CURLFile($filePath),
    ];

    if ($checkDuplicate) {
        $postFields['checkDuplicate'] = 'true';
    }

    $ch = curl_init('https://developer.easyslip.com/api/v1/verify');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $token,
        ],
        CURLOPT_POSTFIELDS => $postFields,
        CURLOPT_TIMEOUT => 30,
    ]);

    $response = curl_exec($ch);
    $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    return [
        'http_code' => $httpCode,
        'body' => $response,
        'json' => $response ? json_decode($response, true) : null,
        'error' => $error,
    ];
}

function easyslip_verify_base64($imageBase64, $token, $checkDuplicate = true) {
    return easyslip_authorized_json_post(
        'https://developer.easyslip.com/api/v1/verify',
        [
            'image' => $imageBase64,
            'checkDuplicate' => (bool)$checkDuplicate,
        ],
        $token
    );
}

function easyslip_verify_truewallet_image($filePath, $token, $checkDuplicate = true) {
    $postFields = [
        'file' => new CURLFile($filePath),
    ];

    if ($checkDuplicate) {
        $postFields['checkDuplicate'] = 'true';
    }

    $ch = curl_init('https://developer.easyslip.com/api/v1/verify/truewallet');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $token,
        ],
        CURLOPT_POSTFIELDS => $postFields,
        CURLOPT_TIMEOUT => 30,
    ]);

    $response = curl_exec($ch);
    $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    return [
        'http_code' => $httpCode,
        'body' => $response,
        'json' => $response ? json_decode($response, true) : null,
        'error' => $error,
    ];
}

function easyslip_authorized_json_post($url, $payload, $token) {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $token,
        ],
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_TIMEOUT => 30,
    ]);

    $response = curl_exec($ch);
    $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    return [
        'http_code' => $httpCode,
        'body' => $response,
        'json' => $response ? json_decode($response, true) : null,
        'error' => $error,
    ];
}

switch ($action) {
case 'get_products':
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = 20;
    $offset = ($page - 1) * $limit;
    $category = isset($_GET['category_id']) ? (int)$_GET['category_id'] : null;

    $productSelect = product_select_sql();

    if ($category) {
        $stmt = $conn->prepare($productSelect . " WHERE p.category_id=? ORDER BY p.id DESC LIMIT ?,?");
        $stmt->bind_param("iii", $category, $offset, $limit);
    } else {
        $stmt = $conn->prepare($productSelect . " ORDER BY p.id DESC LIMIT ?,?");
        $stmt->bind_param("ii", $offset, $limit);
    }
    $stmt->execute();
    json_response($stmt->get_result()->fetch_all(MYSQLI_ASSOC));

case 'get_product':
    $id = (int)($_GET['id'] ?? 0);
    $stmt = $conn->prepare(product_select_sql() . " WHERE p.id = ? LIMIT 1");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    json_response($stmt->get_result()->fetch_assoc());

case 'get_product_detail':
    $id = (int)$_GET['id'];
    $stmt = $conn->prepare("SELECT p.*, c.name as category_name,
        COALESCE(
            (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.id ASC LIMIT 1),
            'https://via.placeholder.com/500'
        ) as image,
        (SELECT MIN(pv.price) FROM product_variants pv WHERE pv.product_id = p.id) as price,
        (SELECT pv.sku FROM product_variants pv WHERE pv.product_id = p.id ORDER BY pv.price ASC, pv.id ASC LIMIT 1) as sku,
        (SELECT AVG(rating) FROM reviews WHERE product_id = p.id) as avg_rating,
        (SELECT COUNT(*) FROM reviews WHERE product_id = p.id) as total_reviews
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        WHERE p.id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $product = $stmt->get_result()->fetch_assoc();

    if ($product) {
        $stmt = $conn->prepare("SELECT image_url FROM product_images WHERE product_id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $product['images'] = array_column($stmt->get_result()->fetch_all(MYSQLI_ASSOC), 'image_url');

        if (empty($product['images'])) {
            $product['images'] = [$product['image']];
        }

        $stmt = $conn->prepare("SELECT 
                pv.id,
                pv.price,
                pv.stock,
                size_attr.attribute_value as size,
                color_attr.attribute_value as color
            FROM product_variants pv 
            LEFT JOIN variant_attributes size_attr 
                ON pv.id = size_attr.variant_id AND size_attr.attribute_name = 'size'
            LEFT JOIN variant_attributes color_attr
                ON pv.id = color_attr.variant_id AND color_attr.attribute_name = 'color'
            WHERE pv.product_id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $product['variants'] = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

        $stmt = $conn->prepare("SELECT r.*, u.name as user_name 
            FROM reviews r 
            JOIN users u ON r.user_id = u.id 
            WHERE r.product_id = ? 
            ORDER BY r.created_at DESC");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $reviews = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

        foreach ($reviews as &$review) {
            $stmt_img = $conn->prepare("SELECT image_url FROM review_images WHERE review_id = ?");
            $stmt_img->bind_param("i", $review['id']);
            $stmt_img->execute();
            $review['photos'] = array_column($stmt_img->get_result()->fetch_all(MYSQLI_ASSOC), 'image_url');
        }
        $product['reviews'] = $reviews;
    }

    json_response($product);

case 'get_product_images':
    $id = (int)$_GET['id'];
    $stmt = $conn->prepare("SELECT image_url FROM product_images WHERE product_id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    json_response($stmt->get_result()->fetch_all(MYSQLI_ASSOC));

case 'get_product_variants':
    $id = (int)$_GET['id'];
    $stmt = $conn->prepare("SELECT 
            pv.id,
            pv.price,
            pv.stock,
            size_attr.attribute_value as size,
            color_attr.attribute_value as color
        FROM product_variants pv 
        LEFT JOIN variant_attributes size_attr 
            ON pv.id = size_attr.variant_id AND size_attr.attribute_name = 'size'
        LEFT JOIN variant_attributes color_attr
            ON pv.id = color_attr.variant_id AND color_attr.attribute_name = 'color'
        WHERE pv.product_id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    json_response($stmt->get_result()->fetch_all(MYSQLI_ASSOC));

case 'get_reviews':
    $id = (int)$_GET['id'];
    $stmt = $conn->prepare("SELECT r.*, u.name as user_name
        FROM reviews r 
        JOIN users u ON r.user_id = u.id 
        WHERE r.product_id = ?
        ORDER BY r.created_at DESC");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $reviews = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    foreach ($reviews as &$review) {
        $r_id = $review['id'];
        $img_stmt = $conn->prepare("SELECT image_url FROM review_images WHERE review_id = ?");
        $img_stmt->bind_param("i", $r_id);
        $img_stmt->execute();
        $review['photos'] = array_column($img_stmt->get_result()->fetch_all(MYSQLI_ASSOC), 'image_url');
    }
    json_response($reviews);

case 'search_products':
    $q = $_GET['q'] ?? '';
    $like = "%$q%";
    $stmt = $conn->prepare(product_select_sql() . " WHERE p.name LIKE ? OR p.brand LIKE ? ORDER BY p.id DESC");
    $stmt->bind_param("ss", $like, $like);
    $stmt->execute();
    json_response($stmt->get_result()->fetch_all(MYSQLI_ASSOC));

case 'add_to_cart':
    $data = read_body();
    $user_id = (int)$data['user_id'];
    $variant_id = (int)$data['variant_id'];
    $qty = (int)($data['quantity'] ?? 1);

    $stmt = $conn->prepare("INSERT INTO cart (user_id, variant_id, quantity) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE quantity = quantity + ?");
    $stmt->bind_param("iiii", $user_id, $variant_id, $qty, $qty);

    if ($stmt->execute()) json_response(["status" => "success"]);
    else json_response(["status" => "error"], 500);

case 'get_cart':
    $user_id = (int)$_GET['user_id'];
    $stmt = $conn->prepare("SELECT 
            c.id,
            c.quantity,
            c.variant_id,
            pv.price,
            COALESCE(va.attribute_value, '-') as size,
            p.id as product_id,
            p.name,
            p.brand,
            COALESCE(
                (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.id ASC LIMIT 1),
                'https://via.placeholder.com/500'
            ) as image
        FROM cart c 
        JOIN product_variants pv ON c.variant_id = pv.id 
        JOIN products p ON pv.product_id = p.id 
        LEFT JOIN variant_attributes va 
            ON pv.id = va.variant_id AND va.attribute_name = 'size'
        WHERE c.user_id = ?
        ORDER BY c.id DESC");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    json_response($stmt->get_result()->fetch_all(MYSQLI_ASSOC));

case 'remove_from_cart':
    $data = read_body();
    $cart_id = (int)$data['id'];
    $user_id = (int)$data['user_id'];

    $stmt = $conn->prepare("DELETE FROM cart WHERE id = ? AND user_id = ?");
    $stmt->bind_param("ii", $cart_id, $user_id);

    if ($stmt->execute()) json_response(["status" => "success"]);
    else json_response(["status" => "error"], 500);

case 'clear_cart':
    $data = read_body();
    $user_id = (int)$data['user_id'];

    $stmt = $conn->prepare("DELETE FROM cart WHERE user_id = ?");
    $stmt->bind_param("i", $user_id);

    if ($stmt->execute()) json_response(["status" => "success"]);
    else json_response(["status" => "error"], 500);

case 'get_banners':
    $result = $conn->query("SELECT * FROM banners WHERE status='active' ORDER BY id DESC");
    json_response($result->fetch_all(MYSQLI_ASSOC));

case 'get_categories':
    $result = $conn->query("SELECT * FROM categories");
    json_response($result->fetch_all(MYSQLI_ASSOC));

case 'register':
    $data = read_body();
    $name = trim($data['name'] ?? '');
    $email = strtolower(trim($data['email'] ?? ''));
    $password = $data['password'] ?? '';
    if (!$name || !$email || !$password) {
        json_response(["status" => "error", "message" => "Missing fields"], 400);
    }
    $hash = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $conn->prepare("INSERT INTO users(name,email,password) VALUES(?,?,?)");
    $stmt->bind_param("sss", $name, $email, $hash);
    if ($stmt->execute()) {
        json_response(["status" => "success"]);
    }
    json_response(["status" => "error", "message" => "Email already exists"], 409);

case 'login':
    $data = read_body();
    $email = strtolower($data['email'] ?? '');
    $password = $data['password'] ?? '';
    $stmt = $conn->prepare("SELECT * FROM users WHERE email=?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();
    if ($user && password_verify($password, $user['password'])) {
        unset($user['password']);
        json_response(["status" => "success", "user" => $user]);
    }
    json_response(["status" => "error", "message" => "Invalid credentials"], 401);

case 'google_login':
    $data = read_body();
    $email = strtolower(trim($data['email'] ?? ''));
    $name = trim($data['name'] ?? '');
    $avatar = trim($data['avatar'] ?? '');

    if (!$email || !$name) {
        json_response(["status" => "error", "message" => "Missing Google user data"], 400);
    }

    $stmt = $conn->prepare("SELECT * FROM users WHERE email=?");
    if (!$stmt) {
        json_response(["status" => "error", "message" => "Database error"], 500);
    }
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();

    if (!$user) {
        $placeholderPassword = password_hash(bin2hex(random_bytes(16)), PASSWORD_DEFAULT);
        $stmt = $conn->prepare("INSERT INTO users(name,email,avatar,password) VALUES(?,?,?,?)");
        if (!$stmt) {
            json_response(["status" => "error", "message" => "Database error"], 500);
        }
        $stmt->bind_param("ssss", $name, $email, $avatar, $placeholderPassword);

        if (!$stmt->execute()) {
            json_response(["status" => "error", "message" => "Unable to create Google user"], 500);
        }

        $userId = $stmt->insert_id;
        $stmt = $conn->prepare("SELECT * FROM users WHERE id = ? LIMIT 1");
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $user = $stmt->get_result()->fetch_assoc();
    }

    if (!$user) {
        json_response(["status" => "error", "message" => "Google login failed"], 500);
    }

    unset($user['password']);
    json_response(["status" => "success", "user" => $user]);

case 'update_profile':
    $data = read_body();
    $id = (int)$data['user_id'];
    $name = $data['name'] ?? '';
    $gender = $data['gender'] ?? '';
    $birth = $data['birth_date'] ?? null;
    $stmt = $conn->prepare("UPDATE users SET name=?,gender=?,birth_date=? WHERE id=?");
    $stmt->bind_param("sssi", $name, $gender, $birth, $id);
    if ($stmt->execute()) {
        json_response(["status" => "success"]);
    }
    json_response(["status" => "error"], 500);

case 'toggle_wishlist':
    $data = read_body();
    $user = (int)$data['user_id'];
    $product = (int)$data['product_id'];
    $stmt = $conn->prepare("SELECT * FROM wishlist WHERE user_id=? AND product_id=?");
    $stmt->bind_param("ii", $user, $product);
    $stmt->execute();
    $exists = $stmt->get_result()->num_rows;
    if ($exists) {
        $stmt = $conn->prepare("DELETE FROM wishlist WHERE user_id=? AND product_id=?");
        $stmt->bind_param("ii", $user, $product);
        $stmt->execute();
        json_response(["status" => "removed"]);
    } else {
        $stmt = $conn->prepare("INSERT INTO wishlist(user_id,product_id) VALUES(?,?)");
        $stmt->bind_param("ii", $user, $product);
        $stmt->execute();
        json_response(["status" => "added"]);
    }

case 'get_wishlist':
    $user = (int)$_GET['user_id'];
    $stmt = $conn->prepare("SELECT 
            p.*,
            COALESCE(
                (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.id ASC LIMIT 1),
                'https://via.placeholder.com/500'
            ) AS image,
            COALESCE(
                (SELECT MIN(pv.price) FROM product_variants pv WHERE pv.product_id = p.id),
                0
            ) AS price,
            0 AS sold
        FROM wishlist w
        JOIN products p ON w.product_id = p.id
        WHERE w.user_id = ?
        ORDER BY p.id DESC");
    $stmt->bind_param("i", $user);
    $stmt->execute();
    json_response($stmt->get_result()->fetch_all(MYSQLI_ASSOC));

case 'save_address':
    $data = read_body();
    $user = (int)$data['user_id'];
    $full_name = $data['full_name'];
    $phone = $data['phone'];
    $province = $data['province'];
    $district = $data['district'];
    $detail = $data['address_detail'];
    $default = $data['is_default'] ?? 0;
    if ($default) {
        $conn->query("UPDATE addresses SET is_default=0 WHERE user_id=$user");
    }
    $stmt = $conn->prepare("INSERT INTO addresses(user_id, full_name, phone, province, district, address_detail, is_default) VALUES(?,?,?,?,?,?,?)");
    $stmt->bind_param("isssssi", $user, $full_name, $phone, $province, $district, $detail, $default);
    if ($stmt->execute()) json_response(["status" => "success"]);
    else json_response(["status" => "error"], 500);

case 'get_addresses':
    $user = (int)$_GET['user_id'];
    $stmt = $conn->prepare("SELECT * FROM addresses WHERE user_id=? ORDER BY is_default DESC, id DESC");
    $stmt->bind_param("i", $user);
    $stmt->execute();
    json_response($stmt->get_result()->fetch_all(MYSQLI_ASSOC));

case 'update_address':
    $data = read_body();
    $id = (int)$data['id'];
    $user = (int)$data['user_id'];
    $full_name = $data['full_name'];
    $phone = $data['phone'];
    $province = $data['province'];
    $district = $data['district'];
    $detail = $data['address_detail'];
    $default = $data['is_default'] ?? 0;

    if ($default) {
        $stmt = $conn->prepare("UPDATE addresses SET is_default=0 WHERE user_id=?");
        $stmt->bind_param("i", $user);
        $stmt->execute();
    }

    $stmt = $conn->prepare("UPDATE addresses SET full_name=?, phone=?, province=?, district=?, address_detail=?, is_default=? WHERE id=? AND user_id=?");
    $stmt->bind_param("sssssiii", $full_name, $phone, $province, $district, $detail, $default, $id, $user);
    if ($stmt->execute()) json_response(["status" => "success"]);
    json_response(["status" => "error"], 500);

case 'delete_address':
    $data = read_body();
    $id = (int)$data['id'];
    $user = (int)$data['user_id'];
    $stmt = $conn->prepare("DELETE FROM addresses WHERE id=? AND user_id=?");
    $stmt->bind_param("ii", $id, $user);
    if ($stmt->execute()) json_response(["status" => "success"]);
    json_response(["status" => "error"], 500);

case 'set_default_address':
    $data = read_body();
    $id = (int)$data['id'];
    $user = (int)$data['user_id'];
    $stmt = $conn->prepare("UPDATE addresses SET is_default=0 WHERE user_id=?");
    $stmt->bind_param("i", $user);
    $stmt->execute();
    $stmt = $conn->prepare("UPDATE addresses SET is_default=1 WHERE id=? AND user_id=?");
    $stmt->bind_param("ii", $id, $user);
    if ($stmt->execute()) json_response(["status" => "success"]);
    json_response(["status" => "error"], 500);

case 'get_coupons':
    $result = $conn->query("SELECT * FROM coupons WHERE status='active' AND quantity > 0 ORDER BY id DESC");
    json_response($result->fetch_all(MYSQLI_ASSOC));

case 'claim_coupon':
    $data = read_body();
    $user = (int)($data['user_id'] ?? 0);
    $coupon = (int)($data['coupon_id'] ?? 0);

    if (!$user || !$coupon) {
        json_response(["status" => "error", "message" => "Missing coupon claim data"], 400);
    }

    $stmt = $conn->prepare("SELECT id FROM user_coupons WHERE user_id=? AND coupon_id=? LIMIT 1");
    $stmt->bind_param("ii", $user, $coupon);
    $stmt->execute();
    $exists = $stmt->get_result()->fetch_assoc();

    if ($exists) {
        json_response(["status" => "exists", "message" => "Coupon already claimed"]);
    }

    $stmt = $conn->prepare("SELECT quantity FROM coupons WHERE id=? AND status='active' LIMIT 1");
    $stmt->bind_param("i", $coupon);
    $stmt->execute();
    $couponRow = $stmt->get_result()->fetch_assoc();

    if (!$couponRow) {
        json_response(["status" => "error", "message" => "Coupon not found"], 404);
    }

    if ((int)$couponRow['quantity'] <= 0) {
        json_response(["status" => "error", "message" => "Coupon is no longer available"], 409);
    }

    $stmt = $conn->prepare("UPDATE coupons SET quantity = quantity - 1 WHERE id=? AND quantity > 0");
    $stmt->bind_param("i", $coupon);

    if (!$stmt->execute() || $stmt->affected_rows === 0) {
        json_response(["status" => "error", "message" => "Coupon is no longer available"], 409);
    }

    $stmt = $conn->prepare("INSERT INTO user_coupons(user_id, coupon_id, used, claimed_at) VALUES(?,?,0,NOW())");
    $stmt->bind_param("ii", $user, $coupon);

    if ($stmt->execute()) {
        json_response(["status" => "success"]);
    }

    $stmt = $conn->prepare("UPDATE coupons SET quantity = quantity + 1 WHERE id=?");
    $stmt->bind_param("i", $coupon);
    $stmt->execute();

    json_response(["status" => "error", "message" => "Unable to claim coupon"], 500);

case 'get_user_coupons':
    $user = (int)($_GET['user_id'] ?? 0);

    if (!$user) {
        json_response([], 200);
    }

    $stmt = $conn->prepare("SELECT
            uc.id as user_coupon_id,
            uc.user_id,
            uc.coupon_id,
            uc.used,
            uc.claimed_at,
            c.id,
            c.code,
            c.discount,
            c.max_discount,
            c.quantity,
            c.expiry_date,
            c.status
        FROM user_coupons uc
        JOIN coupons c ON uc.coupon_id = c.id
        WHERE uc.user_id = ?
        ORDER BY uc.claimed_at DESC, uc.id DESC");
    $stmt->bind_param("i", $user);
    $stmt->execute();
    json_response($stmt->get_result()->fetch_all(MYSQLI_ASSOC));

case 'get_orders':
    $user = (int)($_GET['user_id'] ?? 0);

    $stmt = $conn->prepare("SELECT 
            o.id,
            o.user_id,
            o.total_price,
            o.payment_method,
            o.status,
            o.created_at,
            oi.variant_id,
            oi.quantity,
            oi.price AS item_price,
            p.name,
            p.brand,
            COALESCE(
                (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.id ASC LIMIT 1),
                'https://via.placeholder.com/500'
            ) AS image,
            COALESCE(size_attr.attribute_value, '-') AS size
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN product_variants pv ON oi.variant_id = pv.id
        LEFT JOIN products p ON pv.product_id = p.id
        LEFT JOIN variant_attributes size_attr ON pv.id = size_attr.variant_id AND size_attr.attribute_name = 'size'
        WHERE o.user_id = ?
        ORDER BY o.created_at DESC, o.id DESC, oi.id ASC");
    if (!$stmt) {
        json_response(["status" => "error", "message" => $conn->error], 500);
    }

    $stmt->bind_param("i", $user);
    $stmt->execute();
    $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    $orders = [];
    foreach ($rows as $row) {
        $orderId = $row['id'];

        if (!isset($orders[$orderId])) {
            $orders[$orderId] = [
                'id' => $row['id'],
                'user_id' => $row['user_id'],
                'total_price' => $row['total_price'],
                'payment_method' => payment_method_label($row['payment_method'] ?? 'promptpay'),
                'status' => $row['status'],
                'created_at' => $row['created_at'],
                'items' => []
            ];
        }

        if (!empty($row['variant_id'])) {
            $orders[$orderId]['items'][] = [
                'variant_id' => $row['variant_id'],
                'name' => $row['name'],
                'brand' => $row['brand'],
                'image' => $row['image'],
                'size' => $row['size'],
                'price' => $row['item_price'],
                'quantity' => $row['quantity']
            ];
        }
    }

    json_response(array_values($orders));
    break;

case 'create_order':
    $data = read_body();
    $userId = (int)($data['user_id'] ?? 0);
    $total = (float)($data['total_price'] ?? 0);
    $couponId = (int)($data['coupon_id'] ?? 0);
    $paymentMethod = payment_method_label($data['payment_method'] ?? 'promptpay');
    $items = is_array($data['items'] ?? null) ? $data['items'] : [];

    if (!$userId || $total <= 0 || empty($items)) {
        json_response(["status" => "error", "message" => "Missing order data"], 400);
    }

    $conn->begin_transaction();

    try {
        $stmt = $conn->prepare("INSERT INTO orders(user_id, total_price, payment_method) VALUES (?,?,?)");
        if (!$stmt) {
            throw new Exception($conn->error);
        }
        $stmt->bind_param("ids", $userId, $total, $paymentMethod);
        $stmt->execute();

        $orderId = $conn->insert_id;

        $itemStmt = $conn->prepare("INSERT INTO order_items(order_id, variant_id, quantity, price) VALUES (?,?,?,?)");
        if (!$itemStmt) {
            throw new Exception($conn->error);
        }

        foreach ($items as $item) {
            $variantId = (int)($item['variant_id'] ?? 0);
            $quantity = (int)($item['quantity'] ?? 1);
            $price = (float)($item['price'] ?? 0);

            if (!$variantId || $quantity <= 0) {
                throw new Exception('Invalid order item data');
            }

            $itemStmt->bind_param("iiid", $orderId, $variantId, $quantity, $price);
            $itemStmt->execute();
        }

        if ($couponId > 0) {
            $couponStmt = $conn->prepare("UPDATE user_coupons SET used = 1 WHERE user_id = ? AND coupon_id = ? AND used = 0");
            if (!$couponStmt) {
                throw new Exception($conn->error);
            }

            $couponStmt->bind_param("ii", $userId, $couponId);
            $couponStmt->execute();

            if ($couponStmt->affected_rows === 0) {
                throw new Exception('Coupon is invalid or already used');
            }
        }

        $conn->commit();

        json_response([
            "status" => "success",
            "order_id" => $orderId
        ]);
    } catch (Throwable $e) {
        $conn->rollback();
        json_response(["status" => "error", "message" => $e->getMessage()], 500);
    }
    break;

case 'generate_payment_qr':
    $data = read_body();
    $amount = (float)($data['amount'] ?? 0);
    $promptPay = get_promptpay_target();

    if ($amount <= 0) {
        json_response(["status" => "error", "message" => "Invalid amount"], 400);
    }

    $qrResponse = easyslip_json_post('https://bill-payment-api.easyslip.com/', [
        'type' => 'PROMPTPAY',
        'msisdn' => $promptPay,
        'amount' => round($amount, 2),
    ]);

    if (!empty($qrResponse['error'])) {
        json_response(["status" => "error", "message" => $qrResponse['error']], 500);
    }

    if ($qrResponse['http_code'] < 200 || $qrResponse['http_code'] >= 300 || empty($qrResponse['json']['image_base64'])) {
        json_response([
            "status" => "error",
            "message" => $qrResponse['json']['message'] ?? 'Unable to generate EasySlip QR',
            "debug" => $qrResponse['body'],
        ], 500);
    }

    json_response([
        'status' => 'success',
        'provider' => 'easyslip',
        'qr_image' => create_data_uri($qrResponse['json']['image_base64'], $qrResponse['json']['mime'] ?? 'image/png'),
        'qr_payload' => $qrResponse['json']['payload'] ?? '',
        'promptpay' => $promptPay,
        'amount' => $amount,
    ]);

case 'upload_slip':
    $payload = read_body();
    $orderId = (int)(($_POST['order_id'] ?? 0) ?: ($payload['order_id'] ?? 0));
    $file = $_FILES['slip'] ?? null;
    $slipBase64 = trim((string)($payload['slip_base64'] ?? ''));
    $slipName = trim((string)($payload['slip_name'] ?? 'slip.jpg'));
    $slipType = trim((string)($payload['slip_type'] ?? 'image/jpeg'));
    $expectedPromptPay = normalize_promptpay_target(get_promptpay_target());

    if (!$orderId) {
        json_response(["status" => "error", "message" => "Missing order id"], 400);
    }

    $uploadDir = __DIR__ . DIRECTORY_SEPARATOR . 'uploads';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    $safeOriginalName = preg_replace('/[^A-Za-z0-9._-]/', '_', basename($slipName ?: 'slip.jpg'));
    $name = time() . "_" . $safeOriginalName;
    $savedPath = $uploadDir . DIRECTORY_SEPARATOR . $name;

    if ($file && !empty($file['tmp_name'])) {
        if (!move_uploaded_file($file['tmp_name'], $savedPath)) {
            json_response(["status" => "error", "message" => "Unable to save uploaded slip"], 500);
        }
    } elseif ($slipBase64 !== '') {
        if (strpos($slipBase64, 'base64,') !== false) {
            $slipBase64 = substr($slipBase64, strpos($slipBase64, 'base64,') + 7);
        }

        $decodedImage = base64_decode($slipBase64, true);
        if ($decodedImage === false) {
            json_response(["status" => "error", "message" => "Invalid slip image data"], 400);
        }

        if (file_put_contents($savedPath, $decodedImage) === false) {
            json_response(["status" => "error", "message" => "Unable to save uploaded slip"], 500);
        }
    } else {
        json_response(["status" => "error", "message" => "Missing slip upload data"], 400);
    }

    $conn->begin_transaction();

    try {
        $stmt = $conn->prepare("SELECT total_price, payment_method FROM orders WHERE id = ? LIMIT 1");
        if (!$stmt) {
            throw new Exception($conn->error);
        }
        $stmt->bind_param("i", $orderId);
        $stmt->execute();
        $order = $stmt->get_result()->fetch_assoc();

        if (!$order) {
            throw new Exception('Order not found');
        }

        $paymentMethod = payment_method_label($order['payment_method'] ?? 'promptpay');
        $expectedAmount = (float)$order['total_price'];
        $expectedReceiver = $paymentMethod === 'true_money'
            ? preg_replace('/\D+/', '', get_truemoney_target())
            : normalize_promptpay_target(get_promptpay_target());
        $detectedAmount = null;
        $detectedPromptPay = '';
        $detectedProviderRef = '';
        $slipHash = hash_file('sha256', $savedPath) ?: '';
        $verificationImageBase64 = $slipBase64 !== '' ? $slipBase64 : base64_encode((string)file_get_contents($savedPath));
        $isDuplicateSlip = false;
        $receiverProxy = '';
        $receiverBank = '';
        $amountMatches = false;
        $promptPayMatches = false;
        $providerMessage = '';
        $providerRaw = null;
        $matchReason = 'token_missing';
        $orderStatus = 'verifying';

        $easySlipToken = get_easyslip_token();
        if ($easySlipToken) {
            $verifyResponse = $paymentMethod === 'true_money'
                ? easyslip_verify_truewallet_image($savedPath, $easySlipToken, true)
                : ($verificationImageBase64 !== ''
                    ? easyslip_verify_base64($verificationImageBase64, $easySlipToken, true)
                    : easyslip_verify_image($savedPath, $easySlipToken, true));
            $providerRaw = $verifyResponse['json'];
            $providerMessage = trim((string)($verifyResponse['json']['message'] ?? ''));
            $verification = $verifyResponse['json']['data'] ?? null;

            if (!empty($verifyResponse['error'])) {
                $matchReason = 'easyslip_request_error';
            } elseif ($verification) {
                if ($paymentMethod === 'true_money') {
                    $detectedAmount = isset($verification['amount']['amount'])
                        ? (float)$verification['amount']['amount']
                        : (isset($verification['amount']) ? (float)$verification['amount'] : null);
                    $detectedProviderRef = trim((string)($verification['transactionId'] ?? ($verification['transRef'] ?? '')));

                    $receiverPhone = trim((string)($verification['receiver']['phone'] ?? ''));
                    $receiverProxy = preg_replace('/\D+/', '', (string)($verification['receiver']['account']['proxy']['account'] ?? ''));
                    $receiverBank = preg_replace('/\D+/', '', (string)($verification['receiver']['account']['bank']['account'] ?? ''));
                    $detectedPromptPay = $receiverPhone ?: ($receiverProxy ?: $receiverBank);
                } else {
                    $detectedAmount = isset($verification['amount']['amount']) ? (float)$verification['amount']['amount'] : null;
                    $detectedProviderRef = trim((string)($verification['transRef'] ?? ''));

                    $receiverProxy = normalize_promptpay_target($verification['receiver']['account']['proxy']['account'] ?? '');
                    $receiverBank = normalize_promptpay_target($verification['receiver']['account']['bank']['account'] ?? '');
                    $detectedPromptPay = $receiverProxy ?: $receiverBank;
                }

                $duplicateStmt = $conn->prepare("SELECT id, order_id FROM payments WHERE (provider_ref <> '' AND provider_ref = ?) OR (slip_hash <> '' AND slip_hash = ?) LIMIT 1");
                if (!$duplicateStmt) {
                    throw new Exception($conn->error);
                }
                $duplicateStmt->bind_param("ss", $detectedProviderRef, $slipHash);
                $duplicateStmt->execute();
                $duplicatePayment = $duplicateStmt->get_result()->fetch_assoc();
                $isDuplicateSlip = !empty($duplicatePayment) || $providerMessage === 'duplicate_slip';

                $amountMatches = $detectedAmount !== null && abs($detectedAmount - $expectedAmount) < 0.01;
                $promptPayMatches = $paymentMethod === 'true_money'
                    ? phone_values_match($detectedPromptPay, $expectedReceiver)
                    : promptpay_values_match($detectedPromptPay, $expectedReceiver);

                if ($isDuplicateSlip) {
                    $orderStatus = 'rejected';
                    $matchReason = 'duplicate_slip';
                } elseif ($amountMatches && $promptPayMatches) {
                    $orderStatus = 'waiting';
                    $matchReason = 'matched';
                } else {
                    $orderStatus = 'rejected';
                    $matchReason = 'mismatch';
                }
            } else {
                switch ($providerMessage) {
                    case 'duplicate_slip':
                        $orderStatus = 'rejected';
                        $matchReason = 'duplicate_slip';
                        break;
                    case 'invalid_image':
                    case 'image_size_too_large':
                    case 'invalid_payload':
                    case 'slip_not_found':
                    case 'qrcode_not_found':
                    case 'transaction_not_found':
                        $orderStatus = 'rejected';
                        $matchReason = $providerMessage;
                        break;
                    case 'unauthorized':
                    case 'access_denied':
                    case 'account_not_verified':
                    case 'application_deactivated':
                    case 'quota_exceeded':
                    case 'server_error':
                    case 'api_server_error':
                        $orderStatus = 'verifying';
                        $matchReason = $providerMessage;
                        break;
                    default:
                        $matchReason = 'easyslip_verification_failed';
                        break;
                }
            }
        }

        $paymentStatus = $orderStatus;
        $recordAmount = $detectedAmount !== null ? $detectedAmount : $expectedAmount;

        if (!$isDuplicateSlip) {
            $stmt = $conn->prepare("INSERT INTO payments(order_id,payment_method,amount,slip_image,provider_ref,slip_hash,status) VALUES (?,?,?,?,?,?,?)");
            if (!$stmt) {
                throw new Exception($conn->error);
            }
            $stmt->bind_param("isdssss", $orderId, $paymentMethod, $recordAmount, $name, $detectedProviderRef, $slipHash, $paymentStatus);
            $stmt->execute();
        }

        $stmt = $conn->prepare("UPDATE orders SET status = ? WHERE id = ?");
        if (!$stmt) {
            throw new Exception($conn->error);
        }
        $stmt->bind_param("si", $orderStatus, $orderId);
        $stmt->execute();

        $conn->commit();

        json_response([
            "status" => "success",
            "provider" => $paymentMethod === 'true_money' ? 'easyslip_truewallet' : 'easyslip_bank',
            "payment_method" => $paymentMethod,
            "order_status" => $orderStatus,
            "matched" => $orderStatus === 'waiting',
            "reason" => $matchReason,
            "expected_amount" => $expectedAmount,
            "detected_amount" => $detectedAmount,
            "expected_promptpay" => $expectedReceiver,
            "detected_promptpay" => $detectedPromptPay,
            "expected_receiver" => $expectedReceiver,
            "detected_receiver" => $detectedPromptPay,
            "amount_matches" => $amountMatches,
            "promptpay_matches" => $promptPayMatches,
            "receiver_proxy" => $receiverProxy,
            "receiver_bank" => $receiverBank,
            "provider_ref" => $detectedProviderRef,
            "provider_message" => $providerMessage,
            "slip_hash" => $slipHash,
            "is_duplicate_slip" => $isDuplicateSlip,
            "verification" => $providerRaw,
        ]);
    } catch (Throwable $e) {
        $conn->rollback();
        json_response(["status" => "error", "message" => $e->getMessage()], 500);
    }

default:
    json_response(["status" => "error", "message" => "Action not found"], 404);
}

$conn->close();
