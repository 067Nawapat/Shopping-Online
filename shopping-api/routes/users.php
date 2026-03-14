<?php

switch ($action) {
    case 'toggle_wishlist':
        $data    = read_body();
        $user    = (int)$data['user_id'];
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
        break;

    case 'get_wishlist':
        $user = (int)$_GET['user_id'];
        $stmt = $conn->prepare("
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
            FROM wishlist w
            JOIN products p ON w.product_id = p.id
            WHERE w.user_id = ?
            ORDER BY p.id DESC");
        $stmt->bind_param("i", $user);
        $stmt->execute();
        json_response($stmt->get_result()->fetch_all(MYSQLI_ASSOC));
        break;

    case 'save_address':
        $data     = read_body();
        $user     = (int)$data['user_id'];
        $full_name = $data['full_name'];
        $phone    = $data['phone'];
        $province = $data['province'];
        $district = $data['district'];
        $detail   = $data['address_detail'];
        $default  = $data['is_default'] ?? 0;

        if ($default) {
            $conn->query("UPDATE addresses SET is_default=0 WHERE user_id=$user");
        }

        $stmt = $conn->prepare("INSERT INTO addresses(user_id, full_name, phone, province, district, address_detail, is_default) VALUES(?,?,?,?,?,?,?)");
        $stmt->bind_param("isssssi", $user, $full_name, $phone, $province, $district, $detail, $default);
        if ($stmt->execute()) json_response(["status" => "success"]);
        else json_response(["status" => "error"], 500);
        break;

    case 'get_addresses':
        $user = (int)$_GET['user_id'];
        $stmt = $conn->prepare("SELECT * FROM addresses WHERE user_id=? ORDER BY is_default DESC, id DESC");
        $stmt->bind_param("i", $user);
        $stmt->execute();
        json_response($stmt->get_result()->fetch_all(MYSQLI_ASSOC));
        break;

    case 'update_address':
        $data      = read_body();
        $id        = (int)$data['id'];
        $user      = (int)$data['user_id'];
        $full_name = $data['full_name'];
        $phone     = $data['phone'];
        $province  = $data['province'];
        $district  = $data['district'];
        $detail    = $data['address_detail'];
        $default   = $data['is_default'] ?? 0;

        if ($default) {
            $stmt = $conn->prepare("UPDATE addresses SET is_default=0 WHERE user_id=?");
            $stmt->bind_param("i", $user);
            $stmt->execute();
        }

        $stmt = $conn->prepare("UPDATE addresses SET full_name=?, phone=?, province=?, district=?, address_detail=?, is_default=? WHERE id=? AND user_id=?");
        $stmt->bind_param("sssssiii", $full_name, $phone, $province, $district, $detail, $default, $id, $user);
        if ($stmt->execute()) json_response(["status" => "success"]);
        json_response(["status" => "error"], 500);
        break;

    case 'delete_address':
        $data = read_body();
        $id   = (int)$data['id'];
        $user = (int)$data['user_id'];

        $stmt = $conn->prepare("DELETE FROM addresses WHERE id=? AND user_id=?");
        $stmt->bind_param("ii", $id, $user);
        if ($stmt->execute()) json_response(["status" => "success"]);
        json_response(["status" => "error"], 500);
        break;

    case 'set_default_address':
        $data = read_body();
        $id   = (int)$data['id'];
        $user = (int)$data['user_id'];

        $stmt = $conn->prepare("UPDATE addresses SET is_default=0 WHERE user_id=?");
        $stmt->bind_param("i", $user);
        $stmt->execute();

        $stmt = $conn->prepare("UPDATE addresses SET is_default=1 WHERE id=? AND user_id=?");
        $stmt->bind_param("ii", $id, $user);
        if ($stmt->execute()) json_response(["status" => "success"]);
        json_response(["status" => "error"], 500);
        break;
}
