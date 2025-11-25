<?php
require_once __DIR__ . '/../../config/cors.php';

session_start();
header('Content-Type: application/json');

session_unset();
session_destroy();

echo json_encode(['success' => true, 'message' => 'Logged out successfully']);
?>
