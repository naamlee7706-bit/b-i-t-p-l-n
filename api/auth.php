<?php
header('Content-Type: application/json');
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    if ($action === 'login') {
        $username = $data['username'] ?? '';
        $password = $data['password'] ?? '';

        $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
        $stmt->execute([$username]);
        $user = $stmt->fetch();

        if ($user && $password === $user['password']) {
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            $_SESSION['role'] = $user['role']; // Lưu role vào session
            echo json_encode([
                'message' => 'Đăng nhập thành công', 
                'username' => $user['username'],
                'role' => $user['role']
            ]);
        } else {
            http_response_code(401);
            echo json_encode(['error' => 'Tài khoản hoặc mật khẩu không đúng']);
        }
    } 
    
    elseif ($action === 'register') {
        $username = $data['username'] ?? '';
        $password = $data['password'] ?? '';
        $full_name = $data['full_name'] ?? '';

        // Kiểm tra username tồn tại
        $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
        $stmt->execute([$username]);
        if ($stmt->fetch()) {
            http_response_code(400);
            echo json_encode(['error' => 'Tên đăng nhập đã tồn tại']);
            exit;
        }

        // Thêm user mới (mặc định role là user)
        $stmt = $pdo->prepare("INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, 'user')");
        $stmt->execute([$username, $password, $full_name]);
        echo json_encode(['message' => 'Đăng ký thành công']);
    }

    elseif ($action === 'change_password') {
        if (!isset($_SESSION['user_id'])) {
            http_response_code(401);
            echo json_encode(['error' => 'Vui lòng đăng nhập']);
            exit;
        }

        $old_pass = $data['old_password'] ?? '';
        $new_pass = $data['new_password'] ?? '';

        $stmt = $pdo->prepare("SELECT password FROM users WHERE id = ?");
        $stmt->execute([$_SESSION['user_id']]);
        $user = $stmt->fetch();

        if ($user && $old_pass === $user['password']) {
            $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE id = ?");
            $stmt->execute([$new_pass, $_SESSION['user_id']]);
            echo json_encode(['message' => 'Đổi mật khẩu thành công']);
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Mật khẩu cũ không chính xác']);
        }
    }
} 

elseif ($method === 'GET') {
    if ($action === 'check') {
        if (isset($_SESSION['user_id'])) {
            echo json_encode([
                'isLoggedIn' => true, 
                'username' => $_SESSION['username'],
                'role' => $_SESSION['role']
            ]);
        } else {
            echo json_encode(['isLoggedIn' => false]);
        }
    } 
    
    elseif ($action === 'logout') {
        session_destroy();
        echo json_encode(['message' => 'Đã đăng xuất']);
    }
}
?>
