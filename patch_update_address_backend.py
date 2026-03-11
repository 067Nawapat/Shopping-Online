from pathlib import Path


path = Path(r"C:\xampp\htdocs\shopping-api\api.php")
content = path.read_text(encoding="utf-8")

old = """case 'get_addresses':
    $user = (int)$_GET['user_id'];
    $stmt = $conn->prepare("SELECT * FROM addresses WHERE user_id=? ORDER BY is_default DESC, id DESC");
    $stmt->bind_param("i", $user);
    $stmt->execute();
    json_response($stmt->get_result()->fetch_all(MYSQLI_ASSOC));

case 'delete_address':
"""

new = """case 'get_addresses':
    $user = (int)$_GET['user_id'];
    $stmt = $conn->prepare("SELECT * FROM addresses WHERE user_id=? ORDER BY is_default DESC, id DESC");
    $stmt->bind_param("i", $user);
    $stmt->execute();
    json_response($stmt->get_result()->fetch_all(MYSQLI_ASSOC));

case 'update_address':
    $data = read_body();
    $id = (int)$data['id'];
    $user = (int)$data['user_id'];
    $full_name = $data['full_name'];
    $phone = $data['phone'];
    $province = $data['province'];
    $district = $data['district'];
    $detail = $data['address_detail'];
    $default = $data['is_default'] ?? 0;

    if($default){
        $stmt = $conn->prepare("UPDATE addresses SET is_default=0 WHERE user_id=?");
        $stmt->bind_param("i", $user);
        $stmt->execute();
    }

    $stmt = $conn->prepare("UPDATE addresses SET full_name=?, phone=?, province=?, district=?, address_detail=?, is_default=? WHERE id=? AND user_id=?");
    $stmt->bind_param("sssssiii", $full_name, $phone, $province, $district, $detail, $default, $id, $user);
    if($stmt->execute()) json_response(["status"=>"success"]);
    json_response(["status"=>"error"], 500);

case 'delete_address':
"""

if old not in content:
    raise SystemExit("Target block not found")

path.write_text(content.replace(old, new), encoding="utf-8")
