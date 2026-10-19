<?php
header('Content-Type: application/json');
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

// Hàm kiểm tra đăng nhập
function checkAuth() {
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Bạn cần đăng nhập để thực hiện hành động này']);
        exit;
    }
}

switch ($method) {
    case 'GET':
        $stmt = $pdo->query("SELECT * FROM movies ORDER BY created_at DESC");
        $movies = $stmt->fetchAll();
        echo json_encode($movies);
        break;

    case 'POST':
        checkAuth();
        $data = json_decode(file_get_contents('php://input'), true);
        if (isset($data['title'])) {
            $sql = "INSERT INTO movies (title, genre, duration, release_date, poster_url, trailer_url) VALUES (?, ?, ?, ?, ?, ?)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                $data['title'],
                $data['genre'] ?? '',
                $data['duration'] ?? 0,
                $data['release_date'] ?? date('Y-m-d'),
                $data['poster_url'] ?? '',
                $data['trailer_url'] ?? ''
            ]);
            echo json_encode(['message' => 'Thêm phim thành công', 'id' => $pdo->lastInsertId()]);
        }
        break;

    case 'PUT':
        checkAuth();
        $data = json_decode(file_get_contents('php://input'), true);
        $id = $_GET['id'] ?? null;
        if ($id && isset($data['title'])) {
            $sql = "UPDATE movies SET title=?, genre=?, duration=?, release_date=?, poster_url=?, trailer_url=? WHERE id=?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                $data['title'],
                $data['genre'],
                $data['duration'],
                $data['release_date'],
                $data['poster_url'],
                $data['trailer_url'],
                $id
            ]);
            echo json_encode(['message' => 'Cập nhật phim thành công']);
        }
        break;

    case 'DELETE':
        checkAuth();
        $id = $_GET['id'] ?? null;
        if ($id) {
            $stmt = $pdo->prepare("DELETE FROM movies WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['message' => 'Xóa phim thành công']);
        }
        break;
}
?>
