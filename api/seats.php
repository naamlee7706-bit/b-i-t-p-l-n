<?php
header('Content-Type: application/json');
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'map';
$showtime_id = $_GET['showtime_id'] ?? null;

// Xóa các hold đã hết hạn
$pdo->exec("DELETE FROM seat_holds WHERE expires_at < NOW()");

if ($method === 'GET' && $action === 'map') {
    // Lấy sơ đồ ghế kèm trạng thái: available, held, booked
    if (!$showtime_id) { http_response_code(400); echo json_encode(['error' => 'Thiếu showtime_id']); exit; }

    $stmt = $pdo->prepare("SELECT room_id FROM showtimes WHERE id = ?");
    $stmt->execute([$showtime_id]);
    $showtime = $stmt->fetch();
    if (!$showtime) { http_response_code(404); echo json_encode(['error' => 'Không tìm thấy suất chiếu']); exit; }

    $stmt = $pdo->prepare("
        SELECT s.*,
            CASE
                WHEN bs.seat_id IS NOT NULL THEN 'booked'
                WHEN sh.seat_id IS NOT NULL THEN 'held'
                ELSE 'available'
            END AS status,
            sh.user_id AS held_by_user
        FROM seats s
        LEFT JOIN booking_seats bs ON bs.seat_id = s.id 
            AND bs.booking_id IN (SELECT id FROM bookings WHERE showtime_id = ? AND status = 'confirmed')
        LEFT JOIN seat_holds sh ON sh.seat_id = s.id AND sh.showtime_id = ?
        WHERE s.room_id = ?
        ORDER BY s.row_label, s.seat_number
    ");
    $stmt->execute([$showtime_id, $showtime_id, $showtime['room_id']]);
    $seats = $stmt->fetchAll();

    // Ẩn held_by_user nếu không phải user hiện tại
    $current_user = $_SESSION['user_id'] ?? null;
    foreach ($seats as &$seat) {
        $seat['is_my_hold'] = ($seat['held_by_user'] == $current_user);
        unset($seat['held_by_user']);
    }

    echo json_encode($seats);

} elseif ($method === 'POST' && $action === 'hold') {
    // Giữ ghế 5 phút
    if (!isset($_SESSION['user_id'])) { http_response_code(401); echo json_encode(['error' => 'Chưa đăng nhập']); exit; }

    $data = json_decode(file_get_contents('php://input'), true);
    $seat_ids = $data['seat_ids'] ?? [];
    $showtime_id = $data['showtime_id'] ?? null;
    $stmt = $pdo->prepare("
        INSERT INTO seat_holds (showtime_id, seat_id, user_id, expires_at) 
        VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE)) 
        ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), expires_at = VALUES(expires_at)
    ");

    foreach ($seat_ids as $seat_id) {
        // Kiểm tra đã booked chưa
        $check = $pdo->prepare("SELECT bs.id FROM booking_seats bs JOIN bookings b ON bs.booking_id = b.id WHERE bs.seat_id = ? AND b.showtime_id = ? AND b.status = 'confirmed'");
        $check->execute([$seat_id, $showtime_id]);
        if ($check->fetch()) { $errors[] = "Ghế $seat_id đã được đặt"; continue; }

        // Kiểm tra held bởi người khác
        $held = $pdo->prepare("SELECT user_id FROM seat_holds WHERE seat_id = ? AND showtime_id = ?");
        $held->execute([$seat_id, $showtime_id]);
        $hold = $held->fetch();
        if ($hold && $hold['user_id'] != $_SESSION['user_id']) { $errors[] = "Ghế $seat_id đang được người khác giữ"; continue; }

        $stmt->execute([$showtime_id, $seat_id, $_SESSION['user_id']]);
    }

    if (!empty($errors)) {
        http_response_code(409);
        echo json_encode(['error' => implode(', ', $errors)]);
    } else {
        echo json_encode([
            'message' => 'Giữ ghế thành công', 
            'expires_in' => 300 // 5 phút cố định
        ]);
    }

} elseif ($method === 'DELETE' && $action === 'release') {
    // Giải phóng ghế của user hiện tại
    if (!isset($_SESSION['user_id'])) { http_response_code(401); echo json_encode(['error' => 'Chưa đăng nhập']); exit; }

    $showtime_id = $_GET['showtime_id'] ?? null;
    $stmt = $pdo->prepare("DELETE FROM seat_holds WHERE showtime_id = ? AND user_id = ?");
    $stmt->execute([$showtime_id, $_SESSION['user_id']]);
    echo json_encode(['message' => 'Đã giải phóng ghế']);
}
?>
