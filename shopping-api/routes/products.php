<?php

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
            ) AS price,
            COALESCE(p.sold, 0) as sold
        FROM products p
    ";
}

switch ($action) {
    case 'get_products':
        $page     = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit    = 20;
        $offset   = ($page - 1) * $limit;
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
        break;

    case 'search_products':
        $q = trim($_GET['q'] ?? '');
        $searchTerm = "%$q%";
        $productSelect = product_select_sql();
        $stmt = $conn->prepare($productSelect . " WHERE (p.name LIKE ? OR p.brand LIKE ? OR p.description LIKE ?) ORDER BY p.id DESC");
        $stmt->bind_param("sss", $searchTerm, $searchTerm, $searchTerm);
        $stmt->execute();
        json_response($stmt->get_result()->fetch_all(MYSQLI_ASSOC));
        break;

    case 'get_product_detail':
        $id   = (int)$_GET['id'];
        $stmt = $conn->prepare("SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $product = $stmt->get_result()->fetch_assoc();
        
        if ($product) {
            // Get Images as Array of Strings (Original Format)
            $stmt = $conn->prepare("SELECT image_url FROM product_images WHERE product_id = ?");
            $stmt->bind_param("i", $id); $stmt->execute();
            $product['images'] = array_column($stmt->get_result()->fetch_all(MYSQLI_ASSOC), 'image_url');

            // Get Variants with direct size/color (Original Format for App)
            $stmt = $conn->prepare("SELECT pv.*, 
                (SELECT attribute_value FROM variant_attributes WHERE variant_id = pv.id AND attribute_name = 'size') as size,
                (SELECT attribute_value FROM variant_attributes WHERE variant_id = pv.id AND attribute_name = 'color') as color
                FROM product_variants pv WHERE pv.product_id = ?");
            $stmt->bind_param("i", $id); $stmt->execute();
            $product['variants'] = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

            // Get Reviews
            $stmt = $conn->prepare("SELECT r.*, u.name as user_name FROM reviews r JOIN users u ON r.user_id = u.id WHERE r.product_id = ? ORDER BY r.created_at DESC");
            $stmt->bind_param("i", $id); $stmt->execute();
            $product['reviews'] = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            foreach ($product['reviews'] as &$rev) {
                $img_stmt = $conn->prepare("SELECT image_url FROM review_images WHERE review_id = ?");
                $img_stmt->bind_param("i", $rev['id']); $img_stmt->execute();
                $rev['photos'] = array_column($img_stmt->get_result()->fetch_all(MYSQLI_ASSOC), 'image_url');
            }
        }
        json_response($product);
        break;

    case 'add_review':
        $data = read_body();
        $productId = (int)($data['product_id'] ?? 0);
        $userId = (int)($data['user_id'] ?? 0);
        $orderId = (int)($data['order_id'] ?? 0); // รับ order_id เพิ่มเข้ามา
        $rating = (int)($data['rating'] ?? 0);
        $comment = $data['comment'] ?? '';
        $photos = $data['photos'] ?? [];

        if (!$productId || !$userId || !$rating || !$orderId) {
            json_response(["status" => "error", "message" => "ข้อมูลไม่ครบถ้วน"], 400);
        }

        // 1. เช็กว่า Order นี้มีอยู่จริงและเป็นของผู้ใช้คนนี้ และจัดส่งสำเร็จแล้ว
        $stmtCheck = $conn->prepare("SELECT id FROM orders WHERE id = ? AND user_id = ? AND status = 'completed'");
        $stmtCheck->bind_param("ii", $orderId, $userId);
        $stmtCheck->execute();
        if ($stmtCheck->get_result()->num_rows === 0) {
            json_response(["status" => "error", "message" => "ไม่พบรายการสั่งซื้อที่สำเร็จ"], 403);
        }

        // 2. เช็กว่า Order นี้เคยรีวิวสินค้าตัวนี้ไปแล้วหรือยัง
        $stmtDup = $conn->prepare("SELECT id FROM reviews WHERE order_id = ? AND product_id = ?");
        $stmtDup->bind_param("ii", $orderId, $productId);
        $stmtDup->execute();
        if ($stmtDup->get_result()->num_rows > 0) {
            json_response(["status" => "error", "message" => "คุณได้รีวิวรายการสั่งซื้อนี้ไปแล้ว"], 403);
        }

        $conn->begin_transaction();
        try {
            $stmt = $conn->prepare("INSERT INTO reviews(product_id, user_id, order_id, rating, comment) VALUES(?,?,?,?,?)");
            $stmt->bind_param("iiiis", $productId, $userId, $orderId, $rating, $comment);
            $stmt->execute();
            $reviewId = $stmt->insert_id;

            if (!empty($photos)) {
                $uploadDir = __DIR__ . '/../uploads';
                if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);
                $baseUrl = (isset($_SERVER['HTTPS']) ? "https" : "http") . "://" . $_SERVER['HTTP_HOST'] . str_replace("api.php", "", $_SERVER['SCRIPT_NAME']) . "uploads/";
                foreach ($photos as $photo) {
                    if (empty($photo)) continue;
                    $name = "review_" . time() . "_" . uniqid() . ".jpg";
                    $base64 = $photo;
                    if (strpos($base64, 'base64,') !== false) $base64 = substr($base64, strpos($base64, 'base64,') + 7);
                    $decoded = base64_decode($base64);
                    if ($decoded && file_put_contents($uploadDir . '/' . $name, $decoded)) {
                        $imgUrl = $baseUrl . $name;
                        $imgStmt = $conn->prepare("INSERT INTO review_images(review_id, image_url) VALUES(?,?)");
                        $imgStmt->bind_param("is", $reviewId, $imgUrl);
                        $imgStmt->execute();
                    }
                }
            }
            $conn->commit();
            json_response(["status" => "success", "id" => $reviewId]);
        } catch (Exception $e) { $conn->rollback(); json_response(["status" => "error", "message" => $e->getMessage()], 500); }
        break;

    // ── Admin Actions ──────────────────────────────────────
    case 'admin_get_products':
        $stmt = $conn->prepare("SELECT p.*, c.name as category_name, 
            (SELECT SUM(stock) FROM product_variants WHERE product_id = p.id) as total_stock 
            FROM products p LEFT JOIN categories c ON p.category_id = c.id ORDER BY p.id DESC");
        $stmt->execute();
        json_response($stmt->get_result()->fetch_all(MYSQLI_ASSOC));
        break;

    case 'admin_save_product':
        $data = read_body();
        $id = (int)($data['id'] ?? 0);
        $name = $data['name']; 
        $catId = (int)$data['category_id']; 
        $brand = $data['brand'] ?? '';
        $desc = $data['description'] ?? '';
        $variants = $data['variants'] ?? [];
        $images = $data['images'] ?? [];

        $conn->begin_transaction();
        try {
            if ($id > 0) {
                $stmt = $conn->prepare("UPDATE products SET name=?, category_id=?, brand=?, description=? WHERE id=?");
                $stmt->bind_param("sissi", $name, $catId, $brand, $desc, $id);
                $stmt->execute(); $productId = $id;
            } else {
                $stmt = $conn->prepare("INSERT INTO products(name, category_id, brand, description) VALUES(?,?,?,?)");
                $stmt->bind_param("siss", $name, $catId, $brand, $desc);
                $stmt->execute(); $productId = $conn->insert_id;
            }

            if (!empty($images)) {
                $conn->query("DELETE FROM product_images WHERE product_id = $productId");
                foreach ($images as $img) {
                    $imgUrl = is_array($img) ? $img['image_url'] : $img;
                    if (empty($imgUrl)) continue;
                    $stmt = $conn->prepare("INSERT INTO product_images(product_id, image_url) VALUES(?,?)");
                    $stmt->bind_param("is", $productId, $imgUrl);
                    $stmt->execute();
                }
            }

            $incomingVariantIds = [];
            foreach ($variants as $v) {
                $vId = (int)($v['id'] ?? 0);
                $price = (float)$v['price']; 
                $stock = (int)$v['stock']; 
                $sku = $v['sku'] ?? '';
                $size = $v['size'] ?? null;
                $color = $v['color'] ?? null;

                if ($vId > 0) {
                    $stmt = $conn->prepare("UPDATE product_variants SET price=?, stock=?, sku=? WHERE id=? AND product_id=?");
                    $stmt->bind_param("disii", $price, $stock, $sku, $vId, $productId);
                    $stmt->execute();
                    $varId = $vId;
                } else {
                    $stmt = $conn->prepare("INSERT INTO product_variants(product_id, price, stock, sku) VALUES(?,?,?,?)");
                    $stmt->bind_param("idis", $productId, $price, $stock, $sku);
                    $stmt->execute();
                    $varId = $conn->insert_id;
                }
                $incomingVariantIds[] = $varId;

                // Sync Attributes
                $conn->query("DELETE FROM variant_attributes WHERE variant_id = $varId");
                if ($size) {
                    $stmt = $conn->prepare("INSERT INTO variant_attributes(variant_id, attribute_name, attribute_value) VALUES(?,'size',?)");
                    $stmt->bind_param("is", $varId, $size); $stmt->execute();
                }
                if ($color) {
                    $stmt = $conn->prepare("INSERT INTO variant_attributes(variant_id, attribute_name, attribute_value) VALUES(?,'color',?)");
                    $stmt->bind_param("is", $varId, $color); $stmt->execute();
                }
            }

            if ($id > 0 && !empty($incomingVariantIds)) {
                $idsStr = implode(',', $incomingVariantIds);
                $conn->query("DELETE FROM variant_attributes WHERE variant_id IN (SELECT id FROM product_variants WHERE product_id = $productId AND id NOT IN ($idsStr))");
                $conn->query("DELETE FROM product_variants WHERE product_id = $productId AND id NOT IN ($idsStr)");
            }

            $conn->commit();
            json_response(["status" => "success", "id" => $productId]);
        } catch (Exception $e) { 
            $conn->rollback(); 
            json_response(["status" => "error", "message" => $e->getMessage()], 500); 
        }
        break;

    case 'admin_delete_product':
        $id = (int)$_GET['id'];
        $conn->begin_transaction();
        try {
            $conn->query("DELETE FROM variant_attributes WHERE variant_id IN (SELECT id FROM product_variants WHERE product_id = $id)");
            $conn->query("DELETE FROM product_variants WHERE product_id = $id");
            $conn->query("DELETE FROM product_images WHERE product_id = $id");
            $conn->query("DELETE FROM reviews WHERE product_id = $id");
            $conn->query("DELETE FROM products WHERE id = $id");
            $conn->commit();
            json_response(["status" => "success"]);
        } catch (Exception $e) { $conn->rollback(); json_response(["status" => "error", "message" => $e->getMessage()], 500); }
        break;
}
