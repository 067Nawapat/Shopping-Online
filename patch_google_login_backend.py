from pathlib import Path


path = Path(r"C:\xampp\htdocs\shopping-api\api.php")
content = path.read_text(encoding="utf-8")

start_marker = "case 'google_login':"
end_marker = "case 'update_profile':"

replacement = """case 'google_login':
    $data = read_body();
    $email = strtolower(trim($data['email'] ?? ''));
    $name = trim($data['name'] ?? '');
    $avatar = trim($data['avatar'] ?? '');

    if (!$email || !$name) {
        json_response(["status"=>"error","message"=>"Missing Google user data"], 400);
    }

    $stmt = $conn->prepare("SELECT * FROM users WHERE email=?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();

    if (!$user) {
        $placeholderPassword = password_hash(bin2hex(random_bytes(16)), PASSWORD_DEFAULT);
        $stmt = $conn->prepare("INSERT INTO users(name,email,avatar,password) VALUES(?,?,?,?)");
        $stmt->bind_param("ssss", $name, $email, $avatar, $placeholderPassword);

        if (!$stmt->execute()) {
            json_response(["status"=>"error","message"=>"ไม่สามารถสร้างบัญชี Google ได้: " . $stmt->error], 500);
        }

        $user_id = (int)$conn->insert_id;

        $stmt = $conn->prepare("SELECT * FROM users WHERE id=?");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $user = $stmt->get_result()->fetch_assoc();

        if (!$user) {
            json_response(["status"=>"error","message"=>"สร้างบัญชี Google สำเร็จแต่ดึงข้อมูลผู้ใช้ไม่ได้"], 500);
        }
    } else {
        $shouldUpdateName = empty($user['name']) && $name;
        $shouldUpdateAvatar = (empty($user['avatar']) || $user['avatar'] === null) && $avatar;

        if ($shouldUpdateName || $shouldUpdateAvatar) {
            $updatedName = $shouldUpdateName ? $name : $user['name'];
            $updatedAvatar = $shouldUpdateAvatar ? $avatar : $user['avatar'];

            $stmt = $conn->prepare("UPDATE users SET name=?, avatar=? WHERE id=?");
            $stmt->bind_param("ssi", $updatedName, $updatedAvatar, $user['id']);
            $stmt->execute();

            $stmt = $conn->prepare("SELECT * FROM users WHERE id=?");
            $stmt->bind_param("i", $user['id']);
            $stmt->execute();
            $user = $stmt->get_result()->fetch_assoc();
        }
    }

    unset($user['password']);
    json_response(["status"=>"success","user"=>$user]);

case 'update_profile':"""

start = content.find(start_marker)
end = content.find(end_marker, start)

if start == -1 or end == -1:
    raise SystemExit("google_login block not found")

updated = content[:start] + replacement + content[end + len(end_marker):]

if updated == content:
    raise SystemExit("google_login block not found")

path.write_text(updated, encoding="utf-8")
