<?php
header('Content-Type: application/json');
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    // Xác nhận đặt vé
    if (!isset($_SESSION['user_id'])) { http_response_code(401); echo json_encode(['error' => 'Chưa đăng nhập']); exit; }

    $data = json_decode(file_get_contents('php://input'), true);
    $showtime_id = $data['showtime_id'];
    $seat_ids = $data['seat_ids'];
    $combos = $data['combos'] ?? [];

    // Kiểm tra các ghế vẫn còn hold của user
    $placeholders = implode(',', array_fill(0, count($seat_ids), '?'));
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM seat_holds WHERE showtime_id = ? AND user_id = ? AND seat_id IN ($placeholders) AND expires_at > NOW()");
    $stmt->execute(array_merge([$showtime_id, $_SESSION['user_id']], $seat_ids));
    if ($stmt->fetchColumn() != count($seat_ids)) {
        http_response_code(400);
        echo json_encode(['error' => 'Ghế giữ đã hết hạn hoặc không hợp lệ. Vui lòng chọn lại.']);
        exit;
    }

    // Lấy giá ghế từ suất chiếu
    $stmtShow = $pdo->prepare("SELECT price_standard, price_vip, price_couple FROM showtimes WHERE id = ?");
    $stmtShow->execute([$showtime_id]);
    $prices = $stmtShow->fetch();

    $total_seat_price = 0;
    $seat_details = [];
    foreach ($seat_ids as $seat_id) {
        $s = $pdo->prepare("SELECT seat_type FROM seats WHERE id = ?");
        $s->execute([$seat_id]);
        $seat = $s->fetch();
        $price = match($seat['seat_type']) {
            'vip' => $prices['price_vip'],
            'couple' => $prices['price_couple'],
            default => $prices['price_standard'],
        };
        $total_seat_price += $price;
        $seat_details[] = ['seat_id' => $seat_id, 'price' => $price];
    }

    // Tính giá combo
    $combo_price = 0;
    foreach ($combos as $combo) {
        $combo_price += ($combo['price'] * ($combo['qty'] ?? 1));
    }

    $total_price = $total_seat_price + $combo_price;

    // Bắt đầu transaction
    $pdo->beginTransaction();
    try {
        $stmtBook = $pdo->prepare("INSERT INTO bookings (user_id, showtime_id, combo_json, total_price) VALUES (?, ?, ?, ?)");
        $stmtBook->execute([$_SESSION['user_id'], $showtime_id, json_encode($combos), $total_price]);
        $booking_id = $pdo->lastInsertId();

        $stmtSeat = $pdo->prepare("INSERT INTO booking_seats (booking_id, seat_id, seat_price) VALUES (?, ?, ?)");
        foreach ($seat_details as $sd) {
            $stmtSeat->execute([$booking_id, $sd['seat_id'], $sd['price']]);
        }

        // Xóa holds
        $stmtDel = $pdo->prepare("DELETE FROM seat_holds WHERE showtime_id = ? AND user_id = ?");
        $stmtDel->execute([$showtime_id, $_SESSION['user_id']]);

        $pdo->commit();
        echo json_encode(['message' => 'Đặt vé thành công!', 'booking_id' => $booking_id, 'total_price' => $total_price]);
    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['error' => 'Lỗi hệ thống: ' . $e->getMessage()]);
    }

} elseif ($method === 'GET') {
    // Lịch sử vé của user
    if (!isset($_SESSION['user_id'])) { http_response_code(401); echo json_encode(['error' => 'Chưa đăng nhập']); exit; }

    $stmt = $pdo->prepare("
        SELECT b.*, m.title AS movie_title, m.poster_url,
               r.name AS room_name, st.show_date, st.show_time,
               GROUP_CONCAT(s.row_label, s.seat_number ORDER BY s.row_label, s.seat_number SEPARATOR ', ') AS seats
        FROM bookings b
        JOIN showtimes st ON b.showtime_id = st.id
        JOIN movies m ON st.movie_id = m.id
        JOIN rooms r ON st.room_id = r.id
        LEFT JOIN booking_seats bs ON bs.booking_id = b.id
        LEFT JOIN seats s ON bs.seat_id = s.id
        WHERE b.user_id = ?
        GROUP BY b.id
        ORDER BY b.created_at DESC
    ");
    $stmt->execute([$_SESSION['user_id']]);
    echo json_encode($stmt->fetchAll());
}
?>
