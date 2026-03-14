<?php
require_once 'auth_check.php';
$current_page = basename($_SERVER['PHP_SELF']);
?>
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Panel - Shopping App</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css">
    <style>
        :root { --sidebar-width: 250px; }
        body { background-color: #f8f9fa; }
        .sidebar { width: var(--sidebar-width); height: 100vh; position: fixed; left: 0; top: 0; background: #212529; color: white; padding-top: 20px; z-index: 1000; }
        .main-content { margin-left: var(--sidebar-width); padding: 20px; }
        .nav-link { color: rgba(255,255,255,.75); padding: 12px 20px; }
        .nav-link:hover { color: white; background: rgba(255,255,255,.1); }
        .nav-link.active { color: white; background: #0d6efd; }
        .card { border: none; box-shadow: 0 0.125rem 0.25rem rgba(0,0,0,0.075); border-radius: 10px; }
        .badge-pending { background-color: #ffc107; }
        .badge-waiting { background-color: #17a2b8; }
        .badge-verifying { background-color: #6610f2; }
        .badge-shipping { background-color: #0d6efd; }
        .badge-completed { background-color: #198754; }
        .badge-cancelled { background-color: #dc3545; }
    </style>
</head>
<body>

<div class="sidebar">
    <div class="px-4 mb-4">
        <h4>Shopping Admin</h4>
        <small class="text-muted">ยินดีต้อนรับ, <?= $_SESSION['admin_name'] ?></small>
    </div>
    <nav class="nav flex-column">
        <a class="nav-link <?= $current_page == 'index.php' ? 'active' : '' ?>" href="index.php">
            <i class="bi bi-speedometer2 me-2"></i> Dashboard
        </a>
        <a class="nav-link <?= $current_page == 'orders.php' ? 'active' : '' ?>" href="orders.php">
            <i class="bi bi-cart-fill me-2"></i> คำสั่งซื้อ
        </a>
        <a class="nav-link <?= $current_page == 'products.php' ? 'active' : '' ?>" href="products.php">
            <i class="bi bi-box-seam me-2"></i> จัดการสินค้า
        </a>
        <a class="nav-link <?= $current_page == 'categories.php' ? 'active' : '' ?>" href="categories.php">
            <i class="bi bi-tags me-2"></i> หมวดหมู่
        </a>
        <a class="nav-link <?= $current_page == 'notifications.php' ? 'active' : '' ?>" href="notifications.php">
            <i class="bi bi-megaphone-fill me-2"></i> แจ้งเตือน Push
        </a>
        <a class="nav-link <?= $current_page == 'banners.php' ? 'active' : '' ?>" href="banners.php">
            <i class="bi bi-image me-2"></i> แบนเนอร์
        </a>
        <a class="nav-link <?= $current_page == 'coupons.php' ? 'active' : '' ?>" href="coupons.php">
            <i class="bi bi-ticket-perforated me-2"></i> คูปอง
        </a>
        <a class="nav-link <?= $current_page == 'users.php' ? 'active' : '' ?>" href="users.php">
            <i class="bi bi-people me-2"></i> ผู้ใช้งาน
        </a>
        <hr class="mx-3 my-2 text-secondary">
        <a class="nav-link text-danger" href="logout.php">
            <i class="bi bi-box-arrow-right me-2"></i> ออกจากระบบ
        </a>
    </nav>
</div>

<div class="main-content">
