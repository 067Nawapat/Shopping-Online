<?php

// ฟังก์ชันส่ง Push Notification ผ่าน Expo
function sendExpoPushNotification($tokens, $title, $body, $data = []) {
    if (empty($tokens)) return;
    
    $url = 'https://exp.host/--/api/v2/push/send';
    $messages = [];
    foreach ($tokens as $token) {
        $messages[] = [
            'to' => $token,
            'title' => $title,
            'body' => $body,
            'data' => $data,
            'sound' => 'default'
        ];
    }

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($messages));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $response = curl_exec($ch);
    curl_close($ch);
    return $response;
}

switch ($action) {
    case 'get_notifications':
        $userId = (int)($_GET['user_id'] ?? 0);
        // ดึงทั้งแบบเฉพาะตัวและแบบแจ้งเตือนทุกคน (Global)
        $stmt = $conn->prepare("SELECT * FROM notifications WHERE user_id = ? OR user_id IS NULL ORDER BY created_at DESC LIMIT 50");
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        json_response($stmt->get_result()->fetch_all(MYSQLI_ASSOC));
        break;

    case 'save_push_token':
        $data = read_body();
        $userId = (int)($data['user_id'] ?? 0);
        $token = $data['push_token'] ?? '';
        
        if (!$userId || !$token) {
            json_response(["status" => "error", "message" => "Incomplete data"], 400);
        }

        $stmt = $conn->prepare("INSERT INTO user_push_tokens (user_id, push_token) VALUES (?, ?) ON DUPLICATE KEY UPDATE updated_at=CURRENT_TIMESTAMP");
        $stmt->bind_param("is", $userId, $token);
        if ($stmt->execute()) {
            json_response(["status" => "success"]);
        } else {
            json_response(["status" => "error", "message" => $conn->error], 500);
        }
        break;

    case 'admin_send_notification':
        $data = read_body();
        $title = $data['title'] ?? '';
        $body = $data['body'] ?? '';
        $targetUserId = isset($data['user_id']) ? (int)$data['user_id'] : null;

        if (!$title || !$body) {
            json_response(["status" => "error", "message" => "Title and body are required"], 400);
        }

        // 1. บันทึกลง DB
        $stmt = $conn->prepare("INSERT INTO notifications (user_id, title, body) VALUES (?, ?, ?)");
        $stmt->bind_param("iss", $targetUserId, $title, $body);
        $stmt->execute();

        // 2. ดึง Push Tokens และส่ง Push
        $tokens = [];
        if ($targetUserId) {
            $stmtToken = $conn->prepare("SELECT push_token FROM user_push_tokens WHERE user_id = ?");
            $stmtToken->bind_param("i", $targetUserId);
        } else {
            $stmtToken = $conn->prepare("SELECT push_token FROM user_push_tokens");
        }
        $stmtToken->execute();
        $result = $stmtToken->get_result();
        while ($row = $result->fetch_assoc()) {
            $tokens[] = $row['push_token'];
        }

        if (!empty($tokens)) {
            sendExpoPushNotification($tokens, $title, $body);
        }
        json_response(["status" => "success"]);
        break;

    case 'admin_delete_notification':
        $id = (int)($_GET['id'] ?? 0);
        if ($id <= 0) {
            json_response(["status" => "error", "message" => "Invalid ID"], 400);
        }
        $stmt = $conn->prepare("DELETE FROM notifications WHERE id = ?");
        $stmt->bind_param("i", $id);
        if ($stmt->execute()) {
            json_response(["status" => "success"]);
        } else {
            json_response(["status" => "error", "message" => $conn->error], 500);
        }
        break;
}
