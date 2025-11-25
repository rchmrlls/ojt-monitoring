<?php
require_once '../../config/db.php';
session_start();
header('Content-Type: application/json');
$input = json_decode(file_get_contents("php://input"), true);

if (!isset($input['name'], $input['email'], $input['password'], $input['role'])) {
  echo json_encode(['error' => 'Missing required fields']);
  exit;
}

$name = trim($input['name']);
$email = trim($input['email']);
$password = password_hash($input['password'], PASSWORD_BCRYPT);
$role = trim($input['role']);

try {
  // Check duplicate email
  $check = $conn->prepare("SELECT id FROM users WHERE email = ?");
  $check->execute([$email]);
  if ($check->rowCount() > 0) {
    echo json_encode(['error' => 'Email already exists']);
    exit;
  }

  // Insert new user
  $stmt = $conn->prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)");
  $stmt->execute([$name, $email, $password, $role]);

  echo json_encode(['success' => true, 'message' => 'User registered successfully']);
} catch (PDOException $e) {
  http_response_code(500);
  echo json_encode(['error' => $e->getMessage()]);
}
?>
