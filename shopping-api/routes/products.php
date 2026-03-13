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
            ) AS price
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

    case 'get_product':
        $id   = (int)($_GET['id'] ?? 0);
        $stmt = $conn->prepare(product_select_sql() . " WHERE p.id = ? LIMIT 1");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        json_response($stmt->get_result()->fetch_assoc());
        break;

    case 'get_product_detail':
        $id   = (int)$_GET['id'];
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
        break;

    case 'get_product_images':
        $id   = (int)$_GET['id'];
        $stmt = $conn->prepare("SELECT image_url FROM product_images WHERE product_id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        json_response($stmt->get_result()->fetch_all(MYSQLI_ASSOC));
        break;

    case 'get_product_variants':
        $id   = (int)$_GET['id'];
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
        break;

    case 'get_reviews':
        $id      = (int)$_GET['id'];
        $stmt    = $conn->prepare("SELECT r.*, u.name as user_name
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            WHERE r.product_id = ?
            ORDER BY r.created_at DESC");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $reviews = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

        foreach ($reviews as &$review) {
            $r_id      = $review['id'];
            $img_stmt  = $conn->prepare("SELECT image_url FROM review_images WHERE review_id = ?");
            $img_stmt->bind_param("i", $r_id);
            $img_stmt->execute();
            $review['photos'] = array_column($img_stmt->get_result()->fetch_all(MYSQLI_ASSOC), 'image_url');
        }
        json_response($reviews);
        break;

    case 'add_review':
        $data      = read_body();
        $productId = (int)$data['product_id'];
        $userId    = (int)$data['user_id'];
        $rating    = (int)$data['rating'];
        $comment   = trim($data['comment'] ?? '');

        if (!$productId || !$userId || !$rating) {
            json_response(["status" => "error", "message" => "Missing data"], 400);
        }

        $stmt = $conn->prepare("INSERT INTO reviews(product_id, user_id, rating, comment) VALUES(?,?,?,?)");
        $stmt->bind_param("iiis", $productId, $userId, $rating, $comment);
        if ($stmt->execute()) {
            json_response(["status" => "success", "id" => $stmt->insert_id]);
        }
        json_response(["status" => "error"], 500);
        break;

    case 'search_products':
        $q    = $_GET['q'] ?? '';
        $like = "%$q%";
        $stmt = $conn->prepare(product_select_sql() . " WHERE p.name LIKE ? OR p.brand LIKE ? ORDER BY p.id DESC");
        $stmt->bind_param("ss", $like, $like);
        $stmt->execute();
        json_response($stmt->get_result()->fetch_all(MYSQLI_ASSOC));
        break;
}
