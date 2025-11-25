<?php
require_once '../../config/db.php';
require_once __DIR__ . '/../../config/cors.php';

header("Content-Type: application/json");

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
  // =====================================================
  // GET — Fetch all requirements for a given student
  // =====================================================
  case 'GET':
    $studentId = $_GET['student_id'] ?? null;

    if (!$studentId) {
      echo json_encode(['success' => false, 'message' => 'Missing student_id']);
      exit;
    }

    try {
      // Ensure all requirements exist for this student
      $assignMissing = $conn->prepare("
        INSERT INTO student_requirements (student_id, requirement_id, status)
        SELECT ?, r.id, 'Pending'
        FROM requirements r
        WHERE r.id NOT IN (
          SELECT requirement_id FROM student_requirements WHERE student_id = ?
        )
      ");
      $assignMissing->execute([$studentId, $studentId]);

      // Fetch requirements with student-specific status
      $stmt = $conn->prepare("
        SELECT 
          r.id AS requirement_id,
          r.name AS requirement_name,
          r.description,
          COALESCE(sr.status, 'Pending') AS status,
          sr.submitted_at,
          sr.verified_at,
          sr.verified_by
        FROM requirements r
        LEFT JOIN student_requirements sr 
          ON r.id = sr.requirement_id AND sr.student_id = ?
        ORDER BY r.id ASC
      ");
      $stmt->execute([$studentId]);
      $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

      echo json_encode(['success' => true, 'data' => $data]);
    } catch (Exception $e) {
      echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    break;

  // =====================================================
  // PUT — Update a specific requirement status
  // =====================================================
  case 'PUT':
    $input = json_decode(file_get_contents("php://input"), true);
    $studentId = $input['student_id'] ?? null;
    $requirementId = $input['requirement_id'] ?? null;
    $status = $input['status'] ?? null;

    if (!$studentId || !$requirementId || !$status) {
      echo json_encode(['success' => false, 'message' => 'Missing fields (student_id, requirement_id, status)']);
      exit;
    }

    try {
      $stmt = $conn->prepare("
        UPDATE student_requirements
        SET status = ?, submitted_at = NOW()
        WHERE student_id = ? AND requirement_id = ?
      ");
      $stmt->execute([$status, $studentId, $requirementId]);

      echo json_encode(['success' => true, 'message' => 'Requirement status updated successfully.']);
    } catch (Exception $e) {
      echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    break;

  // =====================================================
  // POST — Reset weekly report status for all students
  // =====================================================
  case 'POST':
    $action = $_GET['action'] ?? '';

    if ($action === 'reset_weekly_report') {
      try {
        $stmt = $conn->prepare("
          UPDATE student_requirements sr
          INNER JOIN requirements r ON sr.requirement_id = r.id
          SET sr.status = 'Pending', sr.submitted_at = NULL
          WHERE r.name = 'Weekly Report'
        ");
        $stmt->execute();

        echo json_encode(['success' => true, 'message' => 'Weekly report statuses reset successfully.']);
      } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
      }
    } else {
      echo json_encode(['success' => false, 'message' => 'Invalid action.']);
    }
    break;

  default:
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    break;
}
?>
