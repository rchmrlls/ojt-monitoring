<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'Admin') {
  http_response_code(403);
  echo json_encode(['error' => 'Access denied. Admins only.']);
  exit;
}
?>
