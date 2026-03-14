<?php
require_once 'header.php';

// --- Process Actions ---

// Function to handle images saving
function saveImages($conn, $product_id, $images_data) {
    $conn->query("DELETE FROM product_images WHERE product_id = $product_id");
    if (!empty($images_data)) {
        foreach ($images_data as $img_url) {
            $img_url = trim($img_url);
            if (empty($img_url)) continue;
            $stmt = $conn->prepare("INSERT INTO product_images (product_id, image_url) VALUES (?, ?)");
            $stmt->bind_param("is", $product_id, $img_url);
            $stmt->execute();
        }
    }
}

// Function to handle variants saving
function saveVariants($conn, $product_id, $variants_data) {
    $keep_ids = [];
    foreach ($variants_data as $v) {
        $v_id = isset($v['id']) ? (int)$v['id'] : 0;
        $price = (float)$v['price'];
        $stock = (int)$v['stock'];
        $sku = $v['sku'] ?? '';
        $size = $v['size'] ?? '';
        $color = $v['color'] ?? '';

        if ($v_id > 0) {
            $stmt = $conn->prepare("UPDATE product_variants SET price=?, stock=?, sku=? WHERE id=? AND product_id=?");
            $stmt->bind_param("disii", $price, $stock, $sku, $v_id, $product_id);
            $stmt->execute();
            $variant_id = $v_id;
        } else {
            $stmt = $conn->prepare("INSERT INTO product_variants (product_id, price, stock, sku) VALUES (?, ?, ?, ?)");
            $stmt->bind_param("idis", $product_id, $price, $stock, $sku);
            $stmt->execute();
            $variant_id = $stmt->insert_id;
        }
        $keep_ids[] = $variant_id;

        $conn->query("DELETE FROM variant_attributes WHERE variant_id = $variant_id");
        if ($size !== '') {
            $stmt_a = $conn->prepare("INSERT INTO variant_attributes (variant_id, attribute_name, attribute_value) VALUES (?, 'size', ?)");
            $stmt_a->bind_param("is", $variant_id, $size);
            $stmt_a->execute();
        }
        if ($color !== '') {
            $stmt_a = $conn->prepare("INSERT INTO variant_attributes (variant_id, attribute_name, attribute_value) VALUES (?, 'color', ?)");
            $stmt_a->bind_param("is", $variant_id, $color);
            $stmt_a->execute();
        }
    }

    if (!empty($keep_ids)) {
        $ids_str = implode(',', $keep_ids);
        $conn->query("DELETE FROM variant_attributes WHERE variant_id IN (SELECT id FROM product_variants WHERE product_id = $product_id AND id NOT IN ($ids_str))");
        $conn->query("DELETE FROM product_variants WHERE product_id = $product_id AND id NOT IN ($ids_str)");
    }
}

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

    if (isset($_POST['variants'])) saveVariants($conn, $product_id, $_POST['variants']);
    if (isset($_POST['image_urls'])) saveImages($conn, $product_id, $_POST['image_urls']);

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

    if (isset($_POST['variants'])) saveVariants($conn, $id, $_POST['variants']);
    if (isset($_POST['image_urls'])) saveImages($conn, $id, $_POST['image_urls']);

    echo "<script>alert('อัปเดตสินค้าสำเร็จ'); window.location.href='products.php';</script>";
}

// Delete Product
if (isset($_GET['delete'])) {
    $id = (int)$_GET['delete'];
    $conn->query("DELETE FROM variant_attributes WHERE variant_id IN (SELECT id FROM product_variants WHERE product_id = $id)");
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
                            <div class="modal-dialog modal-xl">
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
                                                <div class="col-md-12 mb-3">
                                                    <label class="form-label">แบรนด์</label>
                                                    <input type="text" name="brand" class="form-control" value="<?= htmlspecialchars($p['brand']) ?>">
                                                </div>
                                                
                                                <div class="col-12 mb-3">
                                                    <div class="d-flex justify-content-between align-items-center mb-2">
                                                        <label class="form-label mb-0">รูปภาพสินค้า (URLs)</label>
                                                        <button type="button" class="btn btn-sm btn-outline-dark" onclick="addImageRow('image-container-<?= $p['id'] ?>')">+ เพิ่มรูปภาพ</button>
                                                    </div>
                                                    <div id="image-container-<?= $p['id'] ?>">
                                                        <?php 
                                                        $imgs = $conn->query("SELECT image_url FROM product_images WHERE product_id = ".$p['id']);
                                                        if ($imgs->num_rows > 0):
                                                            while($img = $imgs->fetch_assoc()):
                                                        ?>
                                                        <div class="input-group mb-2 image-row">
                                                            <input type="text" name="image_urls[]" class="form-control" value="<?= htmlspecialchars($img['image_url']) ?>" placeholder="https://...">
                                                            <button class="btn btn-outline-danger" type="button" onclick="this.parentElement.remove()"><i class="bi bi-x"></i></button>
                                                        </div>
                                                        <?php endwhile; else: ?>
                                                            <div class="input-group mb-2 image-row">
                                                                <input type="text" name="image_urls[]" class="form-control" placeholder="https://...">
                                                                <button class="btn btn-outline-danger" type="button" onclick="this.parentElement.remove()"><i class="bi bi-x"></i></button>
                                                            </div>
                                                        <?php endif; ?>
                                                    </div>
                                                </div>

                                                <div class="col-12 mb-4">
                                                    <label class="form-label">รายละเอียดสินค้า</label>
                                                    <textarea name="description" class="form-control" rows="3"><?= htmlspecialchars($p['description']) ?></textarea>
                                                </div>

                                                <hr>
                                                <div class="d-flex justify-content-between align-items-center mb-3">
                                                    <h6 class="mb-0">รายการรุ่นสินค้า (Variants)</h6>
                                                    <button type="button" class="btn btn-sm btn-dark" onclick="addVariantRow('variant-container-<?= $p['id'] ?>')">
                                                        + เพิ่มรุ่นสินค้า
                                                    </button>
                                                </div>
                                                
                                                <div id="variant-container-<?= $p['id'] ?>" class="variant-list">
                                                    <div class="row g-2 mb-2 d-none d-md-flex text-muted" style="font-size: 0.85rem;">
                                                        <div class="col-md-2">ไซซ์ (Size)</div>
                                                        <div class="col-md-2">สี (Color)</div>
                                                        <div class="col-md-2">ราคา (฿)</div>
                                                        <div class="col-md-2">สต็อก</div>
                                                        <div class="col-md-3">SKU</div>
                                                        <div class="col-md-1"></div>
                                                    </div>
                                                    <?php 
                                                    $vars = $conn->query("SELECT pv.*, 
                                                        (SELECT attribute_value FROM variant_attributes WHERE variant_id = pv.id AND attribute_name = 'size') as size,
                                                        (SELECT attribute_value FROM variant_attributes WHERE variant_id = pv.id AND attribute_name = 'color') as color
                                                        FROM product_variants pv WHERE pv.product_id = ".$p['id']);
                                                    $v_idx = 0;
                                                    while($v = $vars->fetch_assoc()):
                                                    ?>
                                                    <div class="row g-2 mb-2 variant-row align-items-center">
                                                        <input type="hidden" name="variants[<?= $v_idx ?>][id]" value="<?= $v['id'] ?>">
                                                        <div class="col-md-2">
                                                            <input type="text" name="variants[<?= $v_idx ?>][size]" class="form-control form-control-sm" value="<?= htmlspecialchars($v['size'] ?? '') ?>" placeholder="เช่น 42, M">
                                                        </div>
                                                        <div class="col-md-2">
                                                            <input type="text" name="variants[<?= $v_idx ?>][color]" class="form-control form-control-sm" value="<?= htmlspecialchars($v['color'] ?? '') ?>" placeholder="เช่น ดำ, ขาว">
                                                        </div>
                                                        <div class="col-md-2">
                                                            <input type="number" step="0.01" name="variants[<?= $v_idx ?>][price]" class="form-control form-control-sm" value="<?= $v['price'] ?>" required>
                                                        </div>
                                                        <div class="col-md-2">
                                                            <input type="number" name="variants[<?= $v_idx ?>][stock]" class="form-control form-control-sm" value="<?= $v['stock'] ?>" required>
                                                        </div>
                                                        <div class="col-md-3">
                                                            <input type="text" name="variants[<?= $v_idx ?>][sku]" class="form-control form-control-sm" value="<?= htmlspecialchars($v['sku']) ?>">
                                                        </div>
                                                        <div class="col-md-1 text-end">
                                                            <button type="button" class="btn btn-sm btn-outline-danger" onclick="removeVariantRow(this)">
                                                                <i class="bi bi-x"></i>
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <?php $v_idx++; endwhile; ?>
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
    <div class="modal-dialog modal-xl">
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
                        <div class="col-md-12 mb-3">
                            <label class="form-label">แบรนด์</label>
                            <input type="text" name="brand" class="form-control" placeholder="เช่น Nike, Adidas">
                        </div>
                        
                        <div class="col-12 mb-3">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <label class="form-label mb-0">รูปภาพสินค้า (URLs)</label>
                                <button type="button" class="btn btn-sm btn-outline-dark" onclick="addImageRow('add-image-container')">+ เพิ่มรูปภาพ</button>
                            </div>
                            <div id="add-image-container">
                                <div class="input-group mb-2 image-row">
                                    <input type="text" name="image_urls[]" class="form-control" placeholder="https://...">
                                    <button class="btn btn-outline-danger" type="button" onclick="this.parentElement.remove()"><i class="bi bi-x"></i></button>
                                </div>
                            </div>
                        </div>

                        <div class="col-12 mb-4">
                            <label class="form-label">รายละเอียดสินค้า</label>
                            <textarea name="description" class="form-control" rows="3"></textarea>
                        </div>

                        <hr>
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h6 class="mb-0">ข้อมูลรุ่นสินค้า (อย่างน้อย 1 รายการ)</h6>
                            <button type="button" class="btn btn-sm btn-dark" onclick="addVariantRow('add-variant-container')">
                                + เพิ่มรุ่นสินค้า
                            </button>
                        </div>
                        
                        <div id="add-variant-container" class="variant-list">
                            <div class="row g-2 mb-2 d-none d-md-flex text-muted" style="font-size: 0.85rem;">
                                <div class="col-md-2">ไซซ์ (Size)</div>
                                <div class="col-md-2">สี (Color)</div>
                                <div class="col-md-2">ราคา (฿)</div>
                                <div class="col-md-2">สต็อก</div>
                                <div class="col-md-3">SKU</div>
                                <div class="col-md-1"></div>
                            </div>
                            <div class="row g-2 mb-2 variant-row align-items-center">
                                <div class="col-md-2">
                                    <input type="text" name="variants[0][size]" class="form-control form-control-sm" placeholder="เช่น 42, M">
                                </div>
                                <div class="col-md-2">
                                    <input type="text" name="variants[0][color]" class="form-control form-control-sm" placeholder="เช่น ดำ, ขาว">
                                </div>
                                <div class="col-md-2">
                                    <input type="number" step="0.01" name="variants[0][price]" class="form-control form-control-sm" placeholder="ราคา" required>
                                </div>
                                <div class="col-md-2">
                                    <input type="number" name="variants[0][stock]" class="form-control form-control-sm" placeholder="จำนวน" required>
                                </div>
                                <div class="col-md-3">
                                    <input type="text" name="variants[0][sku]" class="form-control form-control-sm" placeholder="รหัส SKU">
                                </div>
                                <div class="col-md-1 text-end">
                                    <button type="button" class="btn btn-sm btn-outline-danger" onclick="removeVariantRow(this)">
                                        <i class="bi bi-x"></i>
                                    </button>
                                </div>
                            </div>
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

<script>
function addImageRow(containerId) {
    const container = document.getElementById(containerId);
    const div = document.createElement('div');
    div.className = 'input-group mb-2 image-row';
    div.innerHTML = `
        <input type="text" name="image_urls[]" class="form-control" placeholder="https://...">
        <button class="btn btn-outline-danger" type="button" onclick="this.parentElement.remove()"><i class="bi bi-x"></i></button>
    `;
    container.appendChild(div);
}

function addVariantRow(containerId) {
    const container = document.getElementById(containerId);
    const newIdx = Date.now();
    const row = document.createElement('div');
    row.className = 'row g-2 mb-2 variant-row align-items-center';
    row.innerHTML = `
        <div class="col-md-2">
            <input type="text" name="variants[${newIdx}][size]" class="form-control form-control-sm" placeholder="เช่น 42, M">
        </div>
        <div class="col-md-2">
            <input type="text" name="variants[${newIdx}][color]" class="form-control form-control-sm" placeholder="เช่น ดำ, ขาว">
        </div>
        <div class="col-md-2">
            <input type="number" step="0.01" name="variants[${newIdx}][price]" class="form-control form-control-sm" required>
        </div>
        <div class="col-md-2">
            <input type="number" name="variants[${newIdx}][stock]" class="form-control form-control-sm" required>
        </div>
        <div class="col-md-3">
            <input type="text" name="variants[${newIdx}][sku]" class="form-control form-control-sm">
        </div>
        <div class="col-md-1 text-end">
            <button type="button" class="btn btn-sm btn-outline-danger" onclick="removeVariantRow(this)">
                <i class="bi bi-x"></i>
            </button>
        </div>
    `;
    container.appendChild(row);
}

function removeVariantRow(btn) {
    const row = btn.closest('.variant-row');
    const container = row.parentElement;
    if (container.getElementsByClassName('variant-row').length > 1) {
        row.remove();
    } else {
        alert('ต้องมีอย่างน้อย 1 รุ่นสินค้า');
    }
}
</script>

<?php require_once 'footer.php'; ?>
