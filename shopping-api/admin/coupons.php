<?php
require_once 'header.php';

// Add Coupon
if (isset($_POST['add_coupon'])) {
    $code = strtoupper($_POST['code']);
    $discount = $_POST['discount'];
    $max_discount = $_POST['max_discount'] ?: NULL;
    $expiry_date = $_POST['expiry_date'] ?: NULL;
    $quantity = $_POST['quantity'] ?: 0;
    $status = $_POST['status'];

    $stmt = $conn->prepare("INSERT INTO coupons (code, discount, max_discount, expiry_date, quantity, status) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("sddsds", $code, $discount, $max_discount, $expiry_date, $quantity, $status);
    
    if ($stmt->execute()) {
        echo "<script>alert('เพิ่มคูปองสำเร็จ'); window.location.href='coupons.php';</script>";
    } else {
        echo "<script>alert('เกิดข้อผิดพลาด: อาจมีรหัสคูปองนี้อยู่แล้ว');</script>";
    }
}

// Update Coupon Status/Details
if (isset($_POST['update_coupon'])) {
    $id = (int)$_POST['coupon_id'];
    $status = $_POST['status'];
    $quantity = (int)$_POST['quantity'];
    $expiry_date = $_POST['expiry_date'] ?: NULL;

    $stmt = $conn->prepare("UPDATE coupons SET status = ?, quantity = ?, expiry_date = ? WHERE id = ?");
    $stmt->bind_param("sisi", $status, $quantity, $expiry_date, $id);
    
    if ($stmt->execute()) {
        echo "<script>window.location.href='coupons.php';</script>";
    }
}

// Delete Coupon
if (isset($_GET['delete'])) {
    $id = (int)$_GET['delete'];
    $conn->query("DELETE FROM coupons WHERE id = $id");
    header('Location: coupons.php');
}

$coupons = $conn->query("SELECT * FROM coupons ORDER BY id DESC");
?>

<div class="d-flex justify-content-between align-items-center pt-3 pb-2 mb-3 border-bottom">
    <h1 class="h2">จัดการคูปองส่วนลด</h1>
    <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#addCouponModal">
        <i class="bi bi-plus-lg"></i> สร้างคูปองใหม่
    </button>
</div>

<div class="card">
    <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
                <tr>
                    <th>Code</th>
                    <th>ส่วนลด</th>
                    <th>ลดสูงสุด</th>
                    <th>คงเหลือ</th>
                    <th>วันหมดอายุ</th>
                    <th>สถานะ</th>
                    <th>จัดการ</th>
                </tr>
            </thead>
            <tbody>
                <?php while($c = $coupons->fetch_assoc()): ?>
                <tr>
                    <td><strong class="text-primary"><?= $c['code'] ?></strong></td>
                    <td>฿<?= number_format($c['discount']) ?></td>
                    <td><?= $c['max_discount'] ? '฿'.number_format($c['max_discount']) : '-' ?></td>
                    <td><?= $c['quantity'] ?> ใบ</td>
                    <td><?= $c['expiry_date'] ? date('d/m/Y', strtotime($c['expiry_date'])) : 'ไม่มี' ?></td>
                    <td>
                        <span class="badge <?= $c['status'] == 'active' ? 'bg-success' : 'bg-danger' ?>">
                            <?= $c['status'] ?>
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" data-bs-toggle="modal" data-bs-target="#editCoupon-<?= $c['id'] ?>">
                            แก้ไข
                        </button>
                        <a href="?delete=<?= $c['id'] ?>" class="btn btn-sm btn-outline-danger" onclick="return confirm('ยืนยันการลบคูปองนี้?')">
                            <i class="bi bi-trash"></i>
                        </a>

                        <!-- Edit Coupon Modal -->
                        <div class="modal fade" id="editCoupon-<?= $c['id'] ?>" tabindex="-1">
                            <div class="modal-dialog">
                                <div class="modal-content">
                                    <form method="POST">
                                        <div class="modal-header">
                                            <h5 class="modal-title">แก้ไขคูปอง: <?= $c['code'] ?></h5>
                                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                                        </div>
                                        <div class="modal-body">
                                            <input type="hidden" name="coupon_id" value="<?= $c['id'] ?>">
                                            <div class="mb-3">
                                                <label class="form-label">สถานะ</label>
                                                <select name="status" class="form-select">
                                                    <option value="active" <?= $c['status'] == 'active' ? 'selected' : '' ?>>Active (ใช้งานได้)</option>
                                                    <option value="expired" <?= $c['status'] == 'expired' ? 'selected' : '' ?>>Expired (หมดอายุ/ระงับ)</option>
                                                </select>
                                            </div>
                                            <div class="mb-3">
                                                <label class="form-label">จำนวนคงเหลือ (ใบ)</label>
                                                <input type="number" name="quantity" class="form-control" value="<?= $c['quantity'] ?>" required>
                                            </div>
                                            <div class="mb-3">
                                                <label class="form-label">วันหมดอายุ</label>
                                                <input type="date" name="expiry_date" class="form-control" value="<?= $c['expiry_date'] ?>">
                                            </div>
                                        </div>
                                        <div class="modal-footer">
                                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">ยกเลิก</button>
                                            <button type="submit" name="update_coupon" class="btn btn-primary">บันทึกการเปลี่ยนแปลง</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </td>
                </tr>
                <?php endwhile; ?>
            </tbody>
        </table>
    </div>
</div>

<!-- Add Coupon Modal -->
<div class="modal fade" id="addCouponModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <form method="POST">
                <div class="modal-header">
                    <h5 class="modal-title">สร้างคูปองส่วนลด</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="mb-3">
                        <label class="form-label">รหัสคูปอง (Code)</label>
                        <input type="text" name="code" class="form-control" placeholder="เช่น DIS100" required>
                    </div>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="form-label">จำนวนเงินส่วนลด (฿)</label>
                            <input type="number" name="discount" class="form-control" required>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="form-label">ลดสูงสุด (เว้นว่างได้)</label>
                            <input type="number" name="max_discount" class="form-control">
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="form-label">จำนวนที่แจก (ใบ)</label>
                            <input type="number" name="quantity" class="form-control" value="100">
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="form-label">วันหมดอายุ</label>
                            <input type="date" name="expiry_date" class="form-control">
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">สถานะเริ่มต้น</label>
                        <select name="status" class="form-select">
                            <option value="active">Active</option>
                            <option value="expired">Expired</option>
                        </select>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">ยกเลิก</button>
                    <button type="submit" name="add_coupon" class="btn btn-primary">บันทึกคูปอง</button>
                </div>
            </form>
        </div>
    </div>
</div>

<?php require_once 'footer.php'; ?>
