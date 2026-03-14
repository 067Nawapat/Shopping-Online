<?php

switch ($action) {
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
                p.id as product_id,
                p.name,
                p.brand,
                COALESCE(
                    (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.id ASC LIMIT 1),
                    'https://via.placeholder.com/500'
                ) AS image,
                COALESCE(size_attr.attribute_value, '-') AS size,
                s.tracking_number,
                s.carrier,
                s.status_description as shipment_status,
                -- แก้ไข: เช็กว่ารายการใน Order ID นี้ถูกรีวิวไปแล้วหรือยัง
                (SELECT COUNT(*) FROM reviews r WHERE r.order_id = o.id AND r.product_id = p.id) as is_item_reviewed
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN product_variants pv ON oi.variant_id = pv.id
            LEFT JOIN products p ON pv.product_id = p.id
            LEFT JOIN variant_attributes size_attr ON pv.id = size_attr.variant_id AND size_attr.attribute_name = 'size'
            LEFT JOIN shipments s ON o.id = s.order_id
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
                    'id'             => $row['id'],
                    'user_id'        => $row['user_id'],
                    'total_price'    => $row['total_price'],
                    'payment_method' => payment_method_label($row['payment_method'] ?? 'promptpay'),
                    'status'         => $row['status'],
                    'created_at'     => $row['created_at'],
                    'tracking_number' => $row['tracking_number'],
                    'shipment_status' => $row['shipment_status'],
                    'items'          => [],
                ];
            }

            if (!empty($row['variant_id'])) {
                // ถ้าใน Order นี้มีประวัติการรีวิวสินค้านี้แล้ว is_reviewed จะเป็น true
                $isReviewed = (int)$row['is_item_reviewed'] > 0;
                
                $orders[$orderId]['items'][] = [
                    'variant_id' => $row['variant_id'],
                    'product_id' => $row['product_id'],
                    'name'       => $row['name'],
                    'brand'      => $row['brand'],
                    'image'      => $row['image'],
                    'size'       => $row['size'],
                    'price'      => $row['item_price'],
                    'quantity'   => $row['quantity'],
                    'is_reviewed' => $isReviewed,
                    'can_review' => !$isReviewed
                ];
            }
        }

        json_response(array_values($orders));
        break;

    case 'create_order':
        $data          = read_body();
        $userId        = (int)($data['user_id'] ?? 0);
        $total         = (float)($data['total_price'] ?? 0);
        $couponId      = (int)($data['coupon_id'] ?? 0);
        $paymentMethod = payment_method_label($data['payment_method'] ?? 'promptpay');
        $items         = is_array($data['items'] ?? null) ? $data['items'] : [];

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
                $quantity  = (int)($item['quantity'] ?? 1);
                $price     = (float)$item['price'] ?? 0;

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
                "status"   => "success",
                "order_id" => $orderId,
            ]);
        } catch (Throwable $e) {
            $conn->rollback();
            json_response(["status" => "error", "message" => $e->getMessage()], 500);
        }
        break;

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
            $payment = $stmt->get_result()->fetch_assoc();
            if ($payment) {
                $payment['slip_url'] = (isset($_SERVER['HTTPS']) ? "https" : "http") . "://" . $_SERVER['HTTP_HOST'] . str_replace("api.php", "", $_SERVER['SCRIPT_NAME']) . "uploads/" . $payment['slip_image'];
            }
            $order['payment'] = $payment;
        }
        json_response($orders);
        break;

    case 'admin_update_order_status':
        $data = read_body();
        $id = (int)$data['id'];
        $status = $data['status'];
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
        } catch (Exception $e) { $conn->rollback(); json_response(["status" => "error", "message" => $e->getMessage()], 500); }
        break;
}
