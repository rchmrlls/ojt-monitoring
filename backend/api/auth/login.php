<?php
session_start();
require_once '../../config/db.php';
header('Content-Type: application/json');

$input = json_decode(file_get_contents("php://input"), true);
if (!isset($input['email'], $input['password'])) {
  echo json_encode(['success' => false, 'message' => 'Email and password required']);
  exit;
}

$email = trim($input['email']);
$password = trim($input['password']);

try {
  $stmt = $conn->prepare("SELECT * FROM users WHERE email = ? AND status = 'Active'");
  $stmt->execute([$email]);
  $user = $stmt->fetch(PDO::FETCH_ASSOC);

  if (!$user || !password_verify($password, $user['password'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid credentials']);
    exit;
  }

  // Fetch linked student_id if role = Student
  $student_id = null;
  if ($user['role'] === 'Student') {
    $stmt2 = $conn->prepare("SELECT id FROM students WHERE user_id = ?");
    $stmt2->execute([$user['id']]);
    $student = $stmt2->fetch(PDO::FETCH_ASSOC);
    if ($student) {
      $student_id = $student['id'];
    }
  }

  $_SESSION['user_id'] = $user['id'];
  $_SESSION['role'] = $user['role'];
  $_SESSION['name'] = $user['name'];

  echo json_encode([
    'success' => true,
    'message' => 'Login successful',
    'user' => [
      'id' => $user['id'],
      'student_id' => $student_id,
      'name' => $user['name'],
      'email' => $user['email'],
      'role' => $user['role']
    ]
  ]);
} catch (PDOException $e) {
  http_response_code(500);
  echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
