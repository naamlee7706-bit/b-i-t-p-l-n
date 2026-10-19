<?php
header('Content-Type: application/json');
require_once 'db.php';

// Danh sách combo bắp nước cố định
$combos = [
    ['id' => 1, 'name' => 'Combo 1 người', 'description' => '1 Bắp vừa + 1 Nước ngọt 400ml', 'price' => 75000, 'icon' => '🍿'],
    ['id' => 2, 'name' => 'Combo 2 người', 'description' => '2 Bắp vừa + 2 Nước ngọt 400ml', 'price' => 139000, 'icon' => '🍿🥤'],
    ['id' => 3, 'name' => 'Combo VIP', 'description' => '1 Bắp lớn + 2 Nước lớn + 1 Snack', 'price' => 165000, 'icon' => '👑'],
    ['id' => 4, 'name' => 'Chỉ bắp', 'description' => '1 Bắp lớn không nước', 'price' => 55000, 'icon' => '🌽'],
    ['id' => 5, 'name' => 'Chỉ nước', 'description' => '2 Nước ngọt 500ml', 'price' => 40000, 'icon' => '🥤'],
];

echo json_encode($combos);
?>
