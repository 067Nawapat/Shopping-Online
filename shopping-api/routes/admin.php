<?php

// Helper to check admin permission
function check_admin() {
    // In a real app, you should verify a token or session here
    return true; 
}

if (!check_admin()) {
    json_response(["status" => "error", "message" => "Unauthorized"], 401);
}

switch ($action) {
    // ── Products Management (Full) ──────────────────────────
    case 'admin_get_products':
        $stmt = $conn->prepare("SELECT p.*, c.name as category_name,
            (SELECT COUNT(*) FROM product_variants WHERE product_id = p.id) as variant_count,
            (SELECT SUM(stock) FROM product_variants WHERE product_id = p.id) as total_stock
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            ORDER BY p.id DESC");
        $stmt->execute();
        json_response($stmt->get_result()->fetch_all(MYSQLI_ASSOC));
        break;

    case 'admin_save_product':
        $data = read_body();
        $id = (int)($data['id'] ?? 0);
        $name = $data['name'] ?? '';
        $categoryId = (int)($data['category_id'] ?? 0);
        $brand = $data['brand'] ?? '';
        $description = $data['description'] ?? '';
        $variants = $data['variants'] ?? []; // Array of variant objects with attributes
        $images = $data['images'] ?? []; // Array of image URLs or base64

        if (!$name) json_response(["status" => "error", "message" => "Name is required"], 400);

        $conn->begin_transaction();
        try {
            if ($id > 0) {
                $stmt = $conn->prepare("UPDATE products SET name=?, category_id=?, brand=?, description=? WHERE id=?");
                $stmt->bind_param("sissi", $name, $categoryId, $brand, $description, $id);
                $stmt->execute();
                $productId = $id;
            } else {
                $stmt = $conn->prepare("INSERT INTO products (name, category_id, brand, description) VALUES (?,?,?,?)");
                $stmt->bind_param("siss", $name, $categoryId, $brand, $description);
                $stmt->execute();
                $productId = $conn->insert_id;
            }

            // Manage Images
            if (!empty($images)) {
                // Simplified: replace all images
                $conn->query("DELETE FROM product_images WHERE product_id = $productId");
                foreach ($images as $img) {
                    $stmt = $conn->prepare("INSERT INTO product_images (product_id, image_url) VALUES (?,?)");
                    $stmt->bind_param("is", $productId, $img);
                    $stmt->execute();
                }
            }

            // Manage Variants & Attributes
            if (!empty($variants)) {
                // Get existing variants to handle deletes if needed, or just replace
                // For simplicity here, we'll update or insert based on variant ID
                foreach ($variants as $v) {
                    $vId = (int)($v['id'] ?? 0);
                    $price = (float)$v['price'];
                    $stock = (int)$v['stock'];
                    $sku = $v['sku'] ?? '';
                    $attrs = $v['attributes'] ?? []; // e.g. ['size' => '42', 'color' => 'Red']

                    if ($vId > 0) {
                        $stmt = $conn->prepare("UPDATE product_variants SET price=?, stock=?, sku=? WHERE id=?");
                        $stmt->bind_param("disi", $price, $stock, $sku, $vId);
                        $stmt->execute();
                        $variantId = $vId;
                    } else {
                        $stmt = $conn->prepare("INSERT INTO product_variants (product_id, price, stock, sku) VALUES (?,?,?,?)");
                        $stmt->bind_param("idis", $productId, $price, $stock, $sku);
                        $stmt->execute();
                        $variantId = $conn->insert_id;
                    }

                    // Manage Attributes for this variant
                    if (!empty($attrs)) {
                        $conn->query("DELETE FROM variant_attributes WHERE variant_id = $variantId");
                        foreach ($attrs as $key => $val) {
                            $stmt = $conn->prepare("INSERT INTO variant_attributes (variant_id, attribute_name, attribute_value) VALUES (?,?,?)");
                            $stmt->bind_param("iss", $variantId, $key, $val);
                            $stmt->execute();
                        }
                    }
                }
            }

            $conn->commit();
            json_response(["status" => "success", "product_id" => $productId]);
        } catch (Exception $e) {
            $conn->rollback();
            json_response(["status" => "error", "message" => $e->getMessage()], 500);
        }
        break;

    case 'admin_delete_product':
        $id = (int)($_GET['id'] ?? 0);
        $conn->begin_transaction();
        try {
            // Delete chain: attributes -> variants -> images -> reviews -> product
            $conn->query("DELETE FROM variant_attributes WHERE variant_id IN (SELECT id FROM product_variants WHERE product_id = $id)");
            $conn->query("DELETE FROM product_variants WHERE product_id = $id");
            $conn->query("DELETE FROM product_images WHERE product_id = $id");
            $conn->query("DELETE FROM reviews WHERE product_id = $id");
            $conn->query("DELETE FROM products WHERE id = $id");
            $conn->commit();
            json_response(["status" => "success"]);
        } catch (Exception $e) {
            $conn->rollback();
            json_response(["status" => "error", "message" => $e->getMessage()], 500);
        }
        break;

    // ── Orders Management ───────────────────────────────────
    case 'admin_get_orders':
        $stmt = $conn->prepare("SELECT o.*, u.name as user_name, u.email as user_email
            FROM orders o
            JOIN users u ON o.user_id = u.id
            ORDER BY o.created_at DESC");
        $stmt->execute();
        $orders = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        
        foreach ($orders as &$order) {
            $oId = $order['id'];
            $stmt = $conn->prepare("SELECT oi.*, p.name as product_name, pv.sku
                FROM order_items oi
                JOIN product_variants pv ON oi.variant_id = pv.id
                JOIN products p ON pv.product_id = p.id
                WHERE oi.order_id = ?");
            $stmt->bind_param("i", $oId);
            $stmt->execute();
            $order['items'] = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

            $stmt = $conn->prepare("SELECT * FROM payments WHERE order_id = ? ORDER BY id DESC LIMIT 1");
            $stmt->bind_param("i", $oId);
            $stmt->execute();
            $order['payment'] = $stmt->get_result()->fetch_assoc();
            
            $stmt = $conn->prepare("SELECT * FROM shipments WHERE order_id = ?");
            $stmt->bind_param("i", $oId);
            $stmt->execute();
            $order['shipment'] = $stmt->get_result()->fetch_assoc();
        }
        json_response($orders);
        break;

    case 'admin_update_order_status':
        $data = read_body();
        $id = (int)$data['id'];
        $status = $data['status']; // 'pending','waiting','verifying','rejected','shipping','cancelled','completed'
        $trackingNumber = $data['tracking_number'] ?? null;

        $conn->begin_transaction();
        try {
            $stmt = $conn->prepare("UPDATE orders SET status=? WHERE id=?");
            $stmt->bind_param("si", $status, $id);
            $stmt->execute();

            if ($status === 'shipping' && $trackingNumber) {
                $conn->query("DELETE FROM shipments WHERE order_id = $id");
                $stmt = $conn->prepare("INSERT INTO shipments (order_id, tracking_number) VALUES (?,?)");
                $stmt->bind_param("is", $id, $trackingNumber);
                $stmt->execute();
            }

            $conn->commit();
            json_response(["status" => "success"]);
        } catch (Exception $e) {
            $conn->rollback();
            json_response(["status" => "error", "message" => $e->getMessage()], 500);
        }
        break;

    // ── Categories & Coupons ────────────────────────────────
    case 'admin_get_categories':
        $res = $conn->query("SELECT * FROM categories ORDER BY name ASC");
        json_response($res->fetch_all(MYSQLI_ASSOC));
        break;

    case 'admin_save_category':
        $data = read_body();
        $id = (int)($data['id'] ?? 0);
        $name = $data['name'] ?? '';
        if ($id > 0) {
            $stmt = $conn->prepare("UPDATE categories SET name=? WHERE id=?");
            $stmt->bind_param("si", $name, $id);
        } else {
            $stmt = $conn->prepare("INSERT INTO categories (name) VALUES (?)");
            $stmt->bind_param("s", $name);
        }
        $stmt->execute();
        json_response(["status" => "success"]);
        break;

    case 'admin_get_coupons':
        $res = $conn->query("SELECT * FROM coupons ORDER BY id DESC");
        json_response($res->fetch_all(MYSQLI_ASSOC));
        break;

    case 'admin_save_coupon':
        $data = read_body();
        $id = (int)($data['id'] ?? 0);
        $code = $data['code'] ?? '';
        $discount = (float)$data['discount'];
        $expiry = $data['expiry_date'] ?? null;
        $qty = (int)$data['quantity'] ?? 0;

        if ($id > 0) {
            $stmt = $conn->prepare("UPDATE coupons SET code=?, discount=?, expiry_date=?, quantity=? WHERE id=?");
            $stmt->bind_param("sdsii", $code, $discount, $expiry, $qty, $id);
        } else {
            $stmt = $conn->prepare("INSERT INTO coupons (code, discount, expiry_date, quantity) VALUES (?,?,?,?)");
            $stmt->bind_param("sdsi", $code, $discount, $expiry, $qty);
        }
        $stmt->execute();
        json_response(["status" => "success"]);
        break;

    case 'admin_get_dashboard_stats':
        $stats = [
            'total_sales' => $conn->query("SELECT SUM(total_price) FROM orders WHERE status='completed'")->fetch_row()[0] ?? 0,
            'order_count' => $conn->query("SELECT COUNT(*) FROM orders")->fetch_row()[0] ?? 0,
            'user_count' => $conn->query("SELECT COUNT(*) FROM users")->fetch_row()[0] ?? 0,
            'product_count' => $conn->query("SELECT COUNT(*) FROM products")->fetch_row()[0] ?? 0,
            'pending_orders' => $conn->query("SELECT COUNT(*) FROM orders WHERE status IN ('pending', 'waiting', 'verifying')")->fetch_row()[0] ?? 0,
        ];
        json_response($stats);
        break;
}
