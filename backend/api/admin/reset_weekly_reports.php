<?php
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/cors.php';

header("Content-Type: application/json");

try {
  $stmt = $conn->prepare("
      UPDATE student_requirements
      SET status = 'Pending'
      WHERE requirement_id = '6'
  ");
  $stmt->execute();

  echo json_encode(['success' => true, 'message' => 'Weekly reports reset successfully.']);
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
