<?php

switch ($action) {
    case 'track_shipment':
        $barcode = $_GET['barcode'] ?? '';
        $token   = get_thaipost_token();

        if (!$barcode || !$token) {
            json_response(["status" => "error", "message" => "Missing barcode or token"], 400);
        }

        json_response(thaipost_get_status($barcode, $token));
        break;
}
