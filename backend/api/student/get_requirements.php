<?php
require_once '../../config/db.php';
require_once __DIR__ . '/../../config/cors.php';
header("Content-Type: application/json; charset=UTF-8");

$student_id = $_GET['student_id'] ?? $_POST['student_id'] ?? null;

if (!$student_id) {
  echo json_encode(['success' => false, 'message' => 'Missing student ID.']);
  exit;
}

try {
  $stmt = $conn->prepare("
    SELECT 
      r.id AS requirement_id,
      r.name AS requirement_name,
      r.description,
      r.is_required,
      COALESCE(sr.status, 'Pending') AS status,
      sr.file_path,
      sr.uploaded_at,
      sr.verified_at
    FROM requirements r
    LEFT JOIN student_requirements sr
      ON r.id = sr.requirement_id AND sr.student_id = ?
    ORDER BY r.id ASC
  ");
  $stmt->execute([$student_id]);
  $requirements = $stmt->fetchAll(PDO::FETCH_ASSOC);

  echo json_encode([
    'success' => true,
    'data' => $requirements
  ]);
} catch (Exception $e) {
  echo json_encode([
    'success' => false,
    'message' => 'Error fetching requirements: ' . $e->getMessage()
  ]);
}
?>