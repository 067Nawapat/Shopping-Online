<?php

switch ($action) {
    case 'get_banners':
        $result = $conn->query("SELECT * FROM banners WHERE status='active' ORDER BY id DESC");
        json_response($result->fetch_all(MYSQLI_ASSOC));
        break;

    case 'get_categories':
        $result = $conn->query("SELECT * FROM categories");
        json_response($result->fetch_all(MYSQLI_ASSOC));
        break;
}
