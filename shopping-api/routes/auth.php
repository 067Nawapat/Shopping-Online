<?php

switch ($action) {
    case 'register':
        $data     = read_body();
        $name     = trim($data['name'] ?? '');
        $email    = strtolower(trim($data['email'] ?? ''));
        $password = $data['password'] ?? '';

        if (!$name || !$email || !$password) {
            json_response(["status" => "error", "message" => "Missing fields"], 400);
        }

        $hash = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $conn->prepare("INSERT INTO users(name,email,password) VALUES(?,?,?)");
        $stmt->bind_param("sss", $name, $email, $hash);
        if ($stmt->execute()) {
            json_response(["status" => "success"]);
        }
        json_response(["status" => "error", "message" => "Email already exists"], 409);
        break;

    case 'login':
        $data     = read_body();
        $email    = strtolower($data['email'] ?? '');
        $password = $data['password'] ?? '';

        $stmt = $conn->prepare("SELECT * FROM users WHERE email=?");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $user = $stmt->get_result()->fetch_assoc();

        if ($user && password_verify($password, $user['password'])) {
            unset($user['password']);
            json_response(["status" => "success", "user" => $user]);
        }
        json_response(["status" => "error", "message" => "Invalid credentials"], 401);
        break;

    case 'google_login':
        $data    = read_body();
        $idToken = trim($data['idToken'] ?? '');

        // ── Verify idToken กับ Google ──────────────────────
        if (!$idToken) {
            json_response(["status" => "error", "message" => "Missing Google ID token"], 400);
        }

        $googleRes  = @file_get_contents("https://oauth2.googleapis.com/tokeninfo?id_token=" . urlencode($idToken));
        $googleData = $googleRes ? json_decode($googleRes, true) : null;

        $validAudience = '500835206658-1flbb7vnoe6c7d2o0kcth705nhsvjtol.apps.googleusercontent.com';

        if (
            empty($googleData['email']) ||
            empty($googleData['aud']) ||
            $googleData['aud'] !== $validAudience
        ) {
            json_response(["status" => "error", "message" => "Invalid Google token"], 401);
        }

        // ใช้ข้อมูลจาก Google โดยตรง ไม่ trust client
        $email  = strtolower(trim($googleData['email']));
        $name   = trim($googleData['name'] ?? ($data['name'] ?? ''));
        $avatar = trim($googleData['picture'] ?? ($data['avatar'] ?? ''));

        if (!$email || !$name) {
            json_response(["status" => "error", "message" => "Missing Google user data"], 400);
        }

        $stmt = $conn->prepare("SELECT * FROM users WHERE email=?");
        if (!$stmt) {
            json_response(["status" => "error", "message" => "Database error"], 500);
        }
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $user = $stmt->get_result()->fetch_assoc();

        if (!$user) {
            $placeholderPassword = password_hash(bin2hex(random_bytes(16)), PASSWORD_DEFAULT);
            $stmt = $conn->prepare("INSERT INTO users(name,email,avatar,password) VALUES(?,?,?,?)");
            if (!$stmt) {
                json_response(["status" => "error", "message" => "Database error"], 500);
            }
            $stmt->bind_param("ssss", $name, $email, $avatar, $placeholderPassword);

            if (!$stmt->execute()) {
                json_response(["status" => "error", "message" => "Unable to create Google user"], 500);
            }

            $userId = $stmt->insert_id;
            $stmt   = $conn->prepare("SELECT * FROM users WHERE id = ? LIMIT 1");
            $stmt->bind_param("i", $userId);
            $stmt->execute();
            $user = $stmt->get_result()->fetch_assoc();
        }

        if (!$user) {
            json_response(["status" => "error", "message" => "Google login failed"], 500);
        }

        unset($user['password']);
        json_response(["status" => "success", "user" => $user]);
        break;

    case 'update_profile':
        $data   = read_body();
        $id     = (int)$data['user_id'];
        $name   = $data['name'] ?? '';
        $gender = $data['gender'] ?? '';
        $birth  = $data['birth_date'] ?? null;

        $stmt = $conn->prepare("UPDATE users SET name=?,gender=?,birth_date=? WHERE id=?");
        $stmt->bind_param("sssi", $name, $gender, $birth, $id);
        if ($stmt->execute()) {
            json_response(["status" => "success"]);
        }
        json_response(["status" => "error"], 500);
        break;
}
