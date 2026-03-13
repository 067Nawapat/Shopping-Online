<?php

switch ($action) {
    case 'get_coupons':
        $result = $conn->query("SELECT * FROM coupons WHERE status='active' AND quantity > 0 ORDER BY id DESC");
        json_response($result->fetch_all(MYSQLI_ASSOC));
        break;

    case 'claim_coupon':
        $data   = read_body();
        $user   = (int)($data['user_id'] ?? 0);
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
        break;

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
        break;
}
