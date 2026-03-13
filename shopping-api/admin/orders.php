<?php
require_once 'header.php';

// Update Order Status & Tracking
if (isset($_POST['update_status'])) {
    $order_id = (int)$_POST['order_id'];
    $new_status = $_POST['status'];
    $tracking_number = trim($_POST['tracking_number'] ?? '');
    
    $conn->begin_transaction();
    try {
        // Update order status
        $stmt = $conn->prepare("UPDATE orders SET status = ? WHERE id = ?");
        $stmt->bind_param("si", $new_status, $order_id);
        $stmt->execute();
        
        // If status is 'shipping' and tracking is provided, add to shipments
        if ($new_status === 'shipping' && !empty($tracking_number)) {
            // Check if shipment already exists
            $check = $conn->query("SELECT id FROM shipments WHERE order_id = $order_id")->fetch_assoc();
            if ($check) {
                $stmt_s = $conn->prepare("UPDATE shipments SET tracking_number = ? WHERE order_id = ?");
                $stmt_s->bind_param("si", $tracking_number, $order_id);
            } else {
                $stmt_s = $conn->prepare("INSERT INTO shipments (order_id, tracking_number, status_description) VALUES (?, ?, 'เตรียมการจัดส่ง')");
                $stmt_s->bind_param("is", $order_id, $tracking_number);
            }
            $stmt_s->execute();
        }
        
        $conn->commit();
        echo "<script>alert('อัปเดตสถานะสำเร็จ'); window.location.href='orders.php';</script>";
    } catch (Exception $e) {
        $conn->rollback();
        echo "<script>alert('เกิดข้อผิดพลาด: " . $e->getMessage() . "');</script>";
    }
}

$status_filter = $_GET['status'] ?? '';
$where = $status_filter ? "WHERE o.status = '$status_filter'" : "";

$orders = $conn->query("SELECT o.*, u.name as user_name, u.email as user_email, s.tracking_number 
                       FROM orders o 
                       JOIN users u ON o.user_id = u.id 
                       LEFT JOIN shipments s ON o.id = s.order_id
                       $where 
                       ORDER BY o.created_at DESC");

$statuses = ['pending', 'waiting', 'verifying', 'rejected', 'shipping', 'cancelled', 'completed'];
?>

<div class="d-flex justify-content-between align-items-center pt-3 pb-2 mb-3 border-bottom">
    <h1 class="h2">จัดการคำสั่งซื้อ</h1>
    <div class="btn-group">
        <a href="orders.php" class="btn btn-sm btn-outline-secondary">ทั้งหมด</a>
        <a href="orders.php?status=verifying" class="btn btn-sm btn-outline-primary">รอตรวจสอบสลิป</a>
        <a href="orders.php?status=waiting" class="btn btn-sm btn-outline-info">รอจัดส่ง</a>
    </div>
</div>

<div class="card shadow-sm">
    <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
                <tr>
                    <th>ID</th>
                    <th>ลูกค้า</th>
                    <th>ยอดรวม</th>
                    <th>สถานะ</th>
                    <th>Tracking</th>
                    <th>วันที่สั่งซื้อ</th>
                    <th>จัดการ</th>
                </tr>
            </thead>
            <tbody>
                <?php while($order = $orders->fetch_assoc()): ?>
                <tr>
                    <td>#<?= $order['id'] ?></td>
                    <td>
                        <strong><?= htmlspecialchars($order['user_name']) ?></strong><br>
                        <small class="text-muted"><?= htmlspecialchars($order['user_email']) ?></small>
                    </td>
                    <td>฿<?= number_format($order['total_price'], 2) ?></td>
                    <td>
                        <span class="badge badge-<?= $order['status'] ?>">
                            <?= $order['status'] ?>
                        </span>
                    </td>
                    <td>
                        <?php if($order['tracking_number']): ?>
                            <span class="text-primary fw-bold"><?= $order['tracking_number'] ?></span>
                        <?php else: ?>
                            <span class="text-muted small">ยังไม่มีข้อมูล</span>
                        <?php endif; ?>
                    </td>
                    <td><?= date('d/m/Y H:i', strtotime($order['created_at'])) ?></td>
                    <td>
                        <button class="btn btn-sm btn-primary" data-bs-toggle="modal" data-bs-target="#modal-<?= $order['id'] ?>">
                            จัดการ/ตรวจสอบ
                        </button>

                        <!-- Modal -->
                        <div class="modal fade" id="modal-<?= $order['id'] ?>" tabindex="-1">
                            <div class="modal-dialog modal-lg">
                                <div class="modal-content">
                                    <form method="POST">
                                        <div class="modal-header">
                                            <h5 class="modal-title">จัดการออเดอร์ #<?= $order['id'] ?></h5>
                                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                                        </div>
                                        <div class="modal-body">
                                            <input type="hidden" name="order_id" value="<?= $order['id'] ?>">
                                            
                                            <div class="row">
                                                <div class="col-md-6 mb-3">
                                                    <label class="form-label fw-bold">เปลี่ยนสถานะออเดอร์</label>
                                                    <select name="status" class="form-select">
                                                        <?php foreach($statuses as $s): ?>
                                                            <option value="<?= $s ?>" <?= $order['status'] == $s ? 'selected' : '' ?>><?= $s ?></option>
                                                        <?php endforeach; ?>
                                                    </select>
                                                </div>
                                                <div class="col-md-6 mb-3">
                                                    <label class="form-label fw-bold">เลขพัสดุ (Tracking Number)</label>
                                                    <input type="text" name="tracking_number" class="form-control" placeholder="เช่น EF123456789TH" value="<?= $order['tracking_number'] ?>">
                                                    <small class="text-muted">กรอกเมื่อเปลี่ยนสถานะเป็น 'shipping'</small>
                                                </div>
                                            </div>

                                            <div class="row">
                                                <div class="col-md-6">
                                                    <h6>รายการสินค้า:</h6>
                                                    <ul class="list-group mb-3">
                                                        <?php 
                                                        $items = $conn->query("SELECT oi.*, p.name FROM order_items oi JOIN product_variants pv ON oi.variant_id = pv.id JOIN products p ON pv.product_id = p.id WHERE oi.order_id = " . $order['id']);
                                                        while($item = $items->fetch_assoc()): ?>
                                                            <li class="list-group-item d-flex justify-content-between align-items-center py-2">
                                                                <small><?= $item['name'] ?> (x<?= $item['quantity'] ?>)</small>
                                                                <span class="small">฿<?= number_format($item['price'] * $item['quantity'], 2) ?></span>
                                                            </li>
                                                        <?php endwhile; ?>
                                                    </ul>
                                                </div>
                                                <div class="col-md-6">
                                                    <?php
                                                    $payment = $conn->query("SELECT * FROM payments WHERE order_id = " . $order['id'])->fetch_assoc();
                                                    if ($payment && $payment['slip_image']): ?>
                                                        <h6>สลิปการโอนเงิน:</h6>
                                                        <a href="../uploads/<?= $payment['slip_image'] ?>" target="_blank">
                                                            <img src="../uploads/<?= $payment['slip_image'] ?>" class="img-fluid rounded border mb-2" style="max-height: 250px; width: 100%; object-fit: contain;">
                                                        </a>
                                                        <p class="small text-muted mb-0">Ref: <?= $payment['provider_ref'] ?></p>
                                                        <p class="small text-muted">Amount: ฿<?= number_format($payment['amount'], 2) ?></p>
                                                    <?php endif; ?>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="modal-footer">
                                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">ปิด</button>
                                            <button type="submit" name="update_status" class="btn btn-success">บันทึกข้อมูลการจัดส่ง</button>
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

<?php require_once 'footer.php'; ?>
