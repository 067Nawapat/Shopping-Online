<?php

function json_response($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

function read_body() {
    return json_decode(file_get_contents("php://input"), true) ?? [];
}
