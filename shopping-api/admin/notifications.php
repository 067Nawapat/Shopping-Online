<?php
require_once 'header.php';

// เมื่อมีการกดลบ
if (isset($_GET['delete_id'])) {
    $del_id = (int)$_GET['delete_id'];
    
    // ลบโดยตรงผ่าน $conn แทนการใช้ curl เพื่อลดปัญหา Network Error
    $stmt = $conn->prepare("DELETE FROM notifications WHERE id = ?");
    $stmt->bind_param("i", $del_id);
    
    if ($stmt->execute()) {
        echo '<div class="alert alert-success">ลบการแจ้งเตือนเรียบร้อยแล้ว!</div>';
    } else {
        echo '<div class="alert alert-danger">เกิดข้อผิดพลาดในการลบ: ' . $conn->error . '</div>';
    }
}

// เมื่อมีการกดปุ่มส่งเเจ้งเตือน
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $title = $_POST['title'] ?? '';
    $body = $_POST['body'] ?? '';
    $target_user = $_POST['user_id'] ?? null; // NULL = All users

    if ($title && $body) {
        // สำหรับการส่งแจ้งเตือน (Push) ยังจำเป็นต้องเรียกผ่าน API เพราะมี Logic การส่งหา Expo
        $api_url = (isset($_SERVER['HTTPS']) ? "https" : "http") . "://" . $_SERVER['HTTP_HOST'] . str_replace("admin/notifications.php", "api.php", $_SERVER['PHP_SELF']) . "?action=admin_send_notification";
        
        $post_data = [
            'title' => $title,
            'body' => $body,
            'user_id' => $target_user ? (int)$target_user : null
        ];

        $ch = curl_init($api_url);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($post_data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        $result = curl_exec($ch);
        $res_data = json_decode($result, true);
        curl_close($ch);

        if ($res_data && $res_data['status'] === 'success') {
            echo '<div class="alert alert-success">ส่งการแจ้งเตือนเรียบร้อยแล้ว!</div>';
        } else {
            echo '<div class="alert alert-danger">เกิดข้อผิดพลาดในการส่ง: ' . ($res_data['message'] ?? 'Unknown error') . '</div>';
        }
    }
}

// ดึงรายการเเจ้งเตือนที่เคยส่ง
$notis = $conn->query("SELECT n.*, u.name as user_name FROM notifications n LEFT JOIN users u ON n.user_id = u.id ORDER BY n.created_at DESC LIMIT 50")->fetch_all(MYSQLI_ASSOC);
?>

<div class="d-flex justify-content-between align-items-center mb-4">
    <h2>จัดการการแจ้งเตือน (Notifications)</h2>
</div>

<div class="row">
    <div class="col-md-4">
        <div class="card p-4">
            <h5 class="mb-3">ส่งการแจ้งเตือนใหม่</h5>
            <form method="POST">
                <div class="mb-3">
                    <label class="form-label">หัวข้อ (Title)</label>
                    <input type="text" name="title" class="form-control" placeholder="เช่น โปรโมชันใหม่!" required>
                </div>
                <div class="mb-3">
                    <label class="form-label">ข้อความ (Body)</label>
                    <textarea name="body" class="form-control" rows="3" placeholder="รายละเอียดเเจ้งเตือน..." required></textarea>
                </div>
                <div class="mb-3">
                    <label class="form-label">ส่งถึงใคร</label>
                    <select name="user_id" class="form-select">
                        <option value="">ส่งถึงผู้ใช้ทุกคน (Global)</option>
                        <?php
                        $users = $conn->query("SELECT id, name FROM users ORDER BY name ASC");
                        while($u = $users->fetch_assoc()) {
                            echo "<option value='{$u['id']}'>{$u['name']}</option>";
                        }
                        ?>
                    </select>
                </div>
                <button type="submit" class="btn btn-primary w-100">
                    <i class="bi bi-send me-2"></i>ส่งการแจ้งเตือน
                </button>
            </form>
        </div>
    </div>

    <div class="col-md-8">
        <div class="card p-0">
            <div class="card-header bg-white py-3">
                <h5 class="mb-0">ประวัติการแจ้งเตือนล่าสุด</h5>
            </div>
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                    <thead class="table-light">
                        <tr>
                            <th>วันเวลา</th>
                            <th>หัวข้อ</th>
                            <th>ส่งถึง</th>
                            <th>ข้อความ</th>
                            <th class="text-end">จัดการ</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($notis as $n): ?>
                        <tr>
                            <td class="small text-nowrap"><?= date('d/m/y H:i', strtotime($n['created_at'])) ?></td>
                            <td class="fw-bold"><?= htmlspecialchars($n['title']) ?></td>
                            <td>
                                <?php if ($n['user_id']): ?>
                                    <span class="badge bg-info"><?= htmlspecialchars($n['user_name']) ?></span>
                                <?php else: ?>
                                    <span class="badge bg-secondary">ทุกคน</span>
                                <?php endif; ?>
                            </td>
                            <td class="small text-muted"><?= htmlspecialchars(mb_strimwidth($n['body'], 0, 40, "...")) ?></td>
                            <td class="text-end">
                                <a href="?delete_id=<?= $n['id'] ?>" 
                                   class="btn btn-sm btn-outline-danger" 
                                   onclick="return confirm('คุณแน่ใจหรือไม่ที่จะลบการแจ้งเตือนนี้? การลบนี้จะมีผลในแอปของผู้ใช้ด้วย')">
                                    <i class="bi bi-trash"></i>
                                </a>
                            </td>
                        </tr>
                        <?php endforeach; ?>
                        <?php if (empty($notis)): ?>
                        <tr>
                            <td colspan="5" class="text-center py-4 text-muted">ยังไม่มีประวัติการส่งเเจ้งเตือน</td>
                        </tr>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>

<?php require_once 'footer.php'; ?>
