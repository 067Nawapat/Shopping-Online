<?php

global $conn;

switch ($action) {
    case 'track_shipment':
        $barcode = $_GET['barcode'] ?? '';
        $token   = get_thaipost_token();

        if (!$barcode || !$token) {
            json_response(["status" => "error", "message" => "Missing barcode or token"], 400);
        }

        $result = thaipost_get_status($barcode, $token);

        // ถ้าเรียกสำเร็จและมีข้อมูล items ให้เก็บสถานะล่าสุดลงตาราง shipments
        if (is_array($result)
            && !empty($result['status'])
            && !empty($result['response']['items'][$barcode])
            && $conn instanceof mysqli
        ) {
            $events = $result['response']['items'][$barcode];
            // ใช้ entry สุดท้ายเป็นสถานะล่าสุด
            $latest = end($events);

            $statusCode = isset($latest['status']) ? (string)$latest['status'] : null;
            $statusDesc = isset($latest['status_description']) ? (string)$latest['status_description'] : null;
            $location   = isset($latest['location']) ? (string)$latest['location'] : null;

            if ($statusDesc !== null || $statusCode !== null || $location !== null) {
                $stmt = $conn->prepare("
                    UPDATE shipments
                    SET status_code = ?, status_description = ?, location = ?
                    WHERE tracking_number = ?
                ");

                if ($stmt) {
                    $stmt->bind_param(
                        "ssss",
                        $statusCode,
                        $statusDesc,
                        $location,
                        $barcode
                    );
                    $stmt->execute();
                    $stmt->close();
                }
            }

            // ถ้าสถานะล่าสุดคือ "นำจ่ายสำเร็จ" (รหัส 501 หรือ delivery_status = 'S')
            $deliveryStatus = isset($latest['delivery_status']) ? (string)$latest['delivery_status'] : null;
            if ($statusCode === '501' || $deliveryStatus === 'S') {
                $updateOrder = $conn->prepare("
                    UPDATE orders o
                    JOIN shipments s ON s.order_id = o.id
                    SET o.status = 'completed'
                    WHERE s.tracking_number = ?
                      AND o.status <> 'completed'
                ");

                if ($updateOrder) {
                    $updateOrder->bind_param("s", $barcode);
                    $updateOrder->execute();
                    $updateOrder->close();
                }
            }
        }

        json_response($result);
        break;
}
