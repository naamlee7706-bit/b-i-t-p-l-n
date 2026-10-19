<?php
header('Content-Type: application/json');
require_once 'db.php';

// Bảo vệ API: Chỉ Admin mới được xem thống kê
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Không có quyền truy cập']);
    exit;
}

$action = $_GET['action'] ?? 'summary';

switch ($action) {
    case 'summary':
        // Thống kê tổng quan
        $totalRevenue = $pdo->query("SELECT SUM(total_price) FROM bookings WHERE status = 'confirmed'")->fetchColumn();
        $totalTickets = $pdo->query("SELECT COUNT(*) FROM bookings WHERE status = 'confirmed'")->fetchColumn();
        $totalMovies = $pdo->query("SELECT COUNT(*) FROM movies")->fetchColumn();
        $totalUsers = $pdo->query("SELECT COUNT(*) FROM users WHERE role = 'user'")->fetchColumn();

        echo json_encode([
            'total_revenue' => (int)$totalRevenue,
            'total_tickets' => (int)$totalTickets,
            'total_movies' => (int)$totalMovies,
            'total_users' => (int)$totalUsers
        ]);
        break;

    case 'by_movie':
        // Doanh thu theo phim
        $stmt = $pdo->query("
            SELECT m.title, SUM(b.total_price) as revenue, COUNT(b.id) as tickets
            FROM movies m
            JOIN showtimes st ON m.id = st.movie_id
            JOIN bookings b ON st.id = b.showtime_id
            WHERE b.status = 'confirmed'
            GROUP BY m.id
            ORDER BY revenue DESC
        ");
        echo json_encode($stmt->fetchAll());
        break;

    case 'recent':
        // Các lượt đặt vé gần nhất
        $stmt = $pdo->query("
            SELECT b.*, u.full_name, m.title as movie_title
            FROM bookings b
            JOIN users u ON b.user_id = u.id
            JOIN showtimes st ON b.showtime_id = st.id
            JOIN movies m ON st.movie_id = m.id
            ORDER BY b.created_at DESC
            LIMIT 10
        ");
        echo json_encode($stmt->fetchAll());
        break;
}
?>
