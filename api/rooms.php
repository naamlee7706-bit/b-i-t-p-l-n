<?php
header('Content-Type: application/json');
require_once 'db.php';
$stmt = $pdo->query("SELECT * FROM rooms ORDER BY id");
echo json_encode($stmt->fetchAll());
?>
