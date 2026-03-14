<?php

switch ($action) {
    case 'get_banners':
        $res = $conn->query("SELECT * FROM banners WHERE status='active' ORDER BY id DESC");
        json_response($res->fetch_all(MYSQLI_ASSOC));
        break;

    case 'get_categories':
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
