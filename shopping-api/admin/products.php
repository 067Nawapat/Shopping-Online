<?php
require_once 'header.php';

// --- Process Actions ---

// Add Product
if (isset($_POST['add_product'])) {
    $name = $_POST['name'];
    $category_id = $_POST['category_id'];
    $brand = $_POST['brand'];
    $desc = $_POST['description'];
    
    $stmt = $conn->prepare("INSERT INTO products (name, category_id, brand, description) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("siss", $name, $category_id, $brand, $desc);
    $stmt->execute();
    $product_id = $stmt->insert_id;

    // Add Default Variant
    $price = $_POST['price'];
    $stock = $_POST['stock'];
    $sku = $_POST['sku'] ?? '';
    $stmt_v = $conn->prepare("INSERT INTO product_variants (product_id, price, stock, sku) VALUES (?, ?, ?, ?)");
    $stmt_v->bind_param("idis", $product_id, $price, $stock, $sku);
    $stmt_v->execute();

    // Add Image if provided
    if (!empty($_POST['image_url'])) {
        $img_url = $_POST['image_url'];
        $stmt_i = $conn->prepare("INSERT INTO product_images (product_id, image_url) VALUES (?, ?)");
        $stmt_i->bind_param("is", $product_id, $img_url);
        $stmt_i->execute();
    }

    echo "<script>alert('เพิ่มสินค้าสำเร็จ'); window.location.href='products.php';</script>";
}

// Update Product
if (isset($_POST['update_product'])) {
    $id = (int)$_POST['product_id'];
    $name = $_POST['name'];
    $category_id = $_POST['category_id'];
    $brand = $_POST['brand'];
    $desc = $_POST['description'];
    
    $stmt = $conn->prepare("UPDATE products SET name=?, category_id=?, brand=?, description=? WHERE id=?");
    $stmt->bind_param("sissi", $name, $category_id, $brand, $desc, $id);
    $stmt->execute();

    // Update Primary Variant (Simple approach: update the first variant found)
    $v_price = $_POST['price'];
    $v_stock = $_POST['stock'];
    $v_sku = $_POST['sku'];
    
    // Check if variant exists
    $v_check = $conn->query("SELECT id FROM product_variants WHERE product_id = $id LIMIT 1")->fetch_assoc();
    if ($v_check) {
        $stmt_v = $conn->prepare("UPDATE product_variants SET price=?, stock=?, sku=? WHERE product_id=? LIMIT 1");
        $stmt_v->bind_param("disi", $v_price, $v_stock, $v_sku, $id);
        $stmt_v->execute();
    } else {
        $stmt_v = $conn->prepare("INSERT INTO product_variants (product_id, price, stock, sku) VALUES (?, ?, ?, ?)");
        $stmt_v->bind_param("idis", $id, $v_price, $v_stock, $v_sku);
        $stmt_v->execute();
    }

    // Handle Image Update (Simple: Add if new URL provided, or logic can be more complex)
    if (!empty($_POST['image_url'])) {
        $img_url = $_POST['image_url'];
        // Update first image or add new? Let's check first image
        $img_check = $conn->query("SELECT id FROM product_images WHERE product_id = $id LIMIT 1")->fetch_assoc();
        if ($img_check) {
            $stmt_i = $conn->prepare("UPDATE product_images SET image_url=? WHERE product_id=? LIMIT 1");
            $stmt_i->bind_param("si", $img_url, $id);
            $stmt_i->execute();
        } else {
            $stmt_i = $conn->prepare("INSERT INTO product_images (product_id, image_url) VALUES (?, ?)");
            $stmt_i->bind_param("is", $id, $img_url);
            $stmt_i->execute();
        }
    }

    echo "<script>alert('อัปเดตสินค้าสำเร็จ'); window.location.href='products.php';</script>";
}

// Delete Product
if (isset($_GET['delete'])) {
    $id = (int)$_GET['delete'];
    $conn->query("DELETE FROM product_variants WHERE product_id = $id");
    $conn->query("DELETE FROM product_images WHERE product_id = $id");
    $conn->query("DELETE FROM products WHERE id = $id");
    header('Location: products.php');
}

// --- Fetch Data ---

$products = $conn->query("
    SELECT p.*, c.name as cat_name, 
           (SELECT MIN(price) FROM product_variants WHERE product_id = p.id) as min_price,
           (SELECT SUM(stock) FROM product_variants WHERE product_id = p.id) as total_stock,
           (SELECT image_url FROM product_images WHERE product_id = p.id LIMIT 1) as image
    FROM products p 
    LEFT JOIN categories c ON p.category_id = c.id 
    ORDER BY p.id DESC
");

$categories_res = $conn->query("SELECT * FROM categories");
$categories = [];
while($cat = $categories_res->fetch_assoc()) $categories[] = $cat;
?>

<div class="d-flex justify-content-between align-items-center pt-3 pb-2 mb-3 border-bottom">
    <h1 class="h2">จัดการสินค้า</h1>
    <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#addProductModal">
        <i class="bi bi-plus-lg"></i> เพิ่มสินค้าใหม่
    </button>
</div>

<div class="card shadow-sm">
    <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
                <tr>
                    <th>รูปภาพ</th>
                    <th>ชื่อสินค้า</th>
                    <th>หมวดหมู่</th>
                    <th>แบรนด์</th>
                    <th>ราคาเริ่มต้น</th>
                    <th>สต็อกรวม</th>
                    <th class="text-end">จัดการ</th>
                </tr>
            </thead>
            <tbody>
                <?php while($p = $products->fetch_assoc()): ?>
                <tr>
                    <td>
                        <img src="<?= $p['image'] ?: 'https://via.placeholder.com/50' ?>" class="rounded border" width="50" height="50" style="object-fit: cover;">
                    </td>
                    <td>
                        <strong><?= htmlspecialchars($p['name']) ?></strong><br>
                        <small class="text-muted">ID: #<?= $p['id'] ?></small>
                    </td>
                    <td><?= htmlspecialchars($p['cat_name'] ?: '-') ?></td>
                    <td><?= htmlspecialchars($p['brand'] ?: '-') ?></td>
                    <td>฿<?= number_format($p['min_price'], 2) ?></td>
                    <td>
                        <?php if($p['total_stock'] <= 5): ?>
                            <span class="badge bg-danger"><?= $p['total_stock'] ?></span>
                        <?php else: ?>
                            <span class="badge bg-success"><?= $p['total_stock'] ?></span>
                        <?php endif; ?>
                    </td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-outline-primary" data-bs-toggle="modal" data-bs-target="#editProductModal-<?= $p['id'] ?>">
                            <i class="bi bi-pencil"></i> แก้ไข
                        </button>
                        <a href="?delete=<?= $p['id'] ?>" class="btn btn-sm btn-outline-danger" onclick="return confirm('ยืนยันการลบสินค้าชิ้นนี้?')">
                            <i class="bi bi-trash"></i>
                        </a>

                        <!-- Edit Product Modal -->
                        <div class="modal fade" id="editProductModal-<?= $p['id'] ?>" tabindex="-1">
                            <div class="modal-dialog modal-lg">
                                <div class="modal-content text-start">
                                    <form method="POST">
                                        <div class="modal-header">
                                            <h5 class="modal-title">แก้ไขสินค้า: #<?= $p['id'] ?></h5>
                                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                                        </div>
                                        <div class="modal-body">
                                            <input type="hidden" name="product_id" value="<?= $p['id'] ?>">
                                            <div class="row">
                                                <div class="col-md-8 mb-3">
                                                    <label class="form-label">ชื่อสินค้า</label>
                                                    <input type="text" name="name" class="form-control" value="<?= htmlspecialchars($p['name']) ?>" required>
                                                </div>
                                                <div class="col-md-4 mb-3">
                                                    <label class="form-label">หมวดหมู่</label>
                                                    <select name="category_id" class="form-select">
                                                        <?php foreach($categories as $c): ?>
                                                            <option value="<?= $c['id'] ?>" <?= $p['category_id'] == $c['id'] ? 'selected' : '' ?>><?= htmlspecialchars($c['name']) ?></option>
                                                        <?php endforeach; ?>
                                                    </select>
                                                </div>
                                                <div class="col-md-6 mb-3">
                                                    <label class="form-label">แบรนด์</label>
                                                    <input type="text" name="brand" class="form-control" value="<?= htmlspecialchars($p['brand']) ?>">
                                                </div>
                                                <div class="col-md-6 mb-3">
                                                    <label class="form-label">รูปภาพ (URL)</label>
                                                    <input type="text" name="image_url" class="form-control" value="<?= htmlspecialchars($p['image']) ?>">
                                                </div>
                                                
                                                <hr>
                                                <h6>ข้อมูลราคาและสต็อก (ตัวเลือกหลัก)</h6>
                                                <?php 
                                                    // Get primary variant for this product
                                                    $v = $conn->query("SELECT * FROM product_variants WHERE product_id = ".$p['id']." LIMIT 1")->fetch_assoc();
                                                ?>
                                                <div class="col-md-4 mb-3">
                                                    <label class="form-label">ราคา (฿)</label>
                                                    <input type="number" step="0.01" name="price" class="form-control" value="<?= $v['price'] ?? 0 ?>" required>
                                                </div>
                                                <div class="col-md-4 mb-3">
                                                    <label class="form-label">สต็อก (ชิ้น)</label>
                                                    <input type="number" name="stock" class="form-control" value="<?= $v['stock'] ?? 0 ?>" required>
                                                </div>
                                                <div class="col-md-4 mb-3">
                                                    <label class="form-label">SKU</label>
                                                    <input type="text" name="sku" class="form-control" value="<?= htmlspecialchars($v['sku'] ?? '') ?>">
                                                </div>

                                                <div class="col-12 mb-3">
                                                    <label class="form-label">รายละเอียดสินค้า</label>
                                                    <textarea name="description" class="form-control" rows="4"><?= htmlspecialchars($p['description']) ?></textarea>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="modal-footer">
                                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">ยกเลิก</button>
                                            <button type="submit" name="update_product" class="btn btn-primary">บันทึกการเปลี่ยนแปลง</button>
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

<!-- Add Product Modal -->
<div class="modal fade" id="addProductModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <form method="POST">
                <div class="modal-header">
                    <h5 class="modal-title">เพิ่มสินค้าใหม่</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="row">
                        <div class="col-md-8 mb-3">
                            <label class="form-label">ชื่อสินค้า</label>
                            <input type="text" name="name" class="form-control" placeholder="ระบุชื่อสินค้า" required>
                        </div>
                        <div class="col-md-4 mb-3">
                            <label class="form-label">หมวดหมู่</label>
                            <select name="category_id" class="form-select">
                                <?php foreach($categories as $c): ?>
                                    <option value="<?= $c['id'] ?>"><?= htmlspecialchars($c['name']) ?></option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="form-label">แบรนด์</label>
                            <input type="text" name="brand" class="form-control" placeholder="เช่น Nike, Adidas">
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="form-label">รูปภาพ (URL)</label>
                            <input type="text" name="image_url" class="form-control" placeholder="https://...">
                        </div>

                        <hr>
                        <h6>ข้อมูลราคาและสต็อกเริ่มต้น</h6>
                        <div class="col-md-4 mb-3">
                            <label class="form-label">ราคาเริ่มต้น (฿)</label>
                            <input type="number" step="0.01" name="price" class="form-control" required>
                        </div>
                        <div class="col-md-4 mb-3">
                            <label class="form-label">สต็อก (ชิ้น)</label>
                            <input type="number" name="stock" class="form-control" value="0" required>
                        </div>
                        <div class="col-md-4 mb-3">
                            <label class="form-label">SKU</label>
                            <input type="text" name="sku" class="form-control">
                        </div>

                        <div class="col-12 mb-3">
                            <label class="form-label">รายละเอียดสินค้า</label>
                            <textarea name="description" class="form-control" rows="4"></textarea>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">ยกเลิก</button>
                    <button type="submit" name="add_product" class="btn btn-primary">บันทึกสินค้า</button>
                </div>
            </form>
        </div>
    </div>
</div>

<?php require_once 'footer.php'; ?>
