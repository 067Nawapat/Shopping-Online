<?php

switch ($action) {
    case 'add_to_cart':
        $data       = read_body();
        $user_id    = (int)$data['user_id'];
        $variant_id = (int)$data['variant_id'];
        $qty        = (int)($data['quantity'] ?? 1);

        $stmt = $conn->prepare("INSERT INTO cart (user_id, variant_id, quantity) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE quantity = quantity + ?");
        $stmt->bind_param("iiii", $user_id, $variant_id, $qty, $qty);

        if ($stmt->execute()) json_response(["status" => "success"]);
        else json_response(["status" => "error"], 500);
        break;

    case 'get_cart':
        $user_id = (int)$_GET['user_id'];
        $stmt    = $conn->prepare("SELECT
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
        break;

    case 'remove_from_cart':
        $data    = read_body();
        $cart_id = (int)$data['id'];
        $user_id = (int)$data['user_id'];

        $stmt = $conn->prepare("DELETE FROM cart WHERE id = ? AND user_id = ?");
        $stmt->bind_param("ii", $cart_id, $user_id);

        if ($stmt->execute()) json_response(["status" => "success"]);
        else json_response(["status" => "error"], 500);
        break;

    case 'clear_cart':
        $data    = read_body();
        $user_id = (int)$data['user_id'];

        $stmt = $conn->prepare("DELETE FROM cart WHERE user_id = ?");
        $stmt->bind_param("i", $user_id);

        if ($stmt->execute()) json_response(["status" => "success"]);
        else json_response(["status" => "error"], 500);
        break;
}
