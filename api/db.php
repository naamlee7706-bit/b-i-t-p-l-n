<?php
session_start();
$host = 'localhost';
$db   = 'quan_ly_rap_phim';
$user = 'root';
$pass = ''; // Mặc định của XAMPP là trống
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
     $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
     die("Kết nối database thất bại: " . $e->getMessage());
}
?>
