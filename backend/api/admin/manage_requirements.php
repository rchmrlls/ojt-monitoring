<?php
require_once '../../config/db.php';
require_once __DIR__ . '/../../config/cors.php';

header("Content-Type: application/json");

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
  case 'GET':
    $studentId = $_GET['student_id'] ?? null;

    if (!$studentId) {
      echo json_encode(['success' => false, 'message' => 'Missing student_id']);
      exit;
    }

    try {
      // Ensure specific student has entries (inserts 'Pending' if missing)
      $assignMissing = $conn->prepare("
        INSERT INTO student_requirements (student_id, requirement_id, status)
        SELECT ?, r.id, 'Pending'
        FROM requirements r
        WHERE r.id NOT IN (
          SELECT requirement_id FROM student_requirements WHERE student_id = ?
        )
      ");
      $assignMissing->execute([$studentId, $studentId]);

      $stmt = $conn->prepare("
        SELECT 
          sr.id AS submission_id,  /* <--- Added this to get the unique row ID */
          r.id AS requirement_id,
          r.name AS requirement_name,
          r.description,
          r.is_required, 
          COALESCE(sr.status, 'Pending') AS status,
          sr.uploaded_at, 
          sr.file_path,
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

  case 'PUT':
    $input = json_decode(file_get_contents("php://input"), true);
    $studentId = $input['student_id'] ?? null;
    $requirementId = $input['requirement_id'] ?? null;
    $submissionId = $input['submission_id'] ?? null; /* <--- Get the specific ID */
    $status = $input['status'] ?? null;

    if (!$studentId || !$requirementId || !$status) {
      echo json_encode(['success' => false, 'message' => 'Missing fields']);
      exit;
    }

    try {
      if ($status === 'Rejected') {
          // 🔴 REJECT LOGIC: Delete using the unique submission_id
          
          if ($submissionId) {
             // 1. Fetch file path using unique ID
             $stmtFile = $conn->prepare("SELECT file_path FROM student_requirements WHERE id = ?");
             $stmtFile->execute([$submissionId]);
             $fileData = $stmtFile->fetch(PDO::FETCH_ASSOC);

             // 2. Delete file
             if ($fileData && !empty($fileData['file_path'])) {
                 $filePath = __DIR__ . '/../../' . $fileData['file_path'];
                 if (file_exists($filePath)) {
                     unlink($filePath);
                 }
             }

             // 3. DELETE row by unique ID
             $stmt = $conn->prepare("DELETE FROM student_requirements WHERE id = ?");
             $stmt->execute([$submissionId]);
          } else {
             // Fallback if no submission_id (though unlikely with proper flow)
             $stmt = $conn->prepare("DELETE FROM student_requirements WHERE student_id = ? AND requirement_id = ?");
             $stmt->execute([$studentId, $requirementId]);
          }

      } elseif ($status === 'Pending') {
          // Reset
          $stmt = $conn->prepare("
            UPDATE student_requirements
            SET status = ?, submitted_at = NULL
            WHERE student_id = ? AND requirement_id = ?
          ");
          $stmt->execute([$status, $studentId, $requirementId]);
      } else {
          // Update
          $stmt = $conn->prepare("
            UPDATE student_requirements
            SET status = ?, submitted_at = NOW()
            WHERE student_id = ? AND requirement_id = ?
          ");
          $stmt->execute([$status, $studentId, $requirementId]);
      }
      
      echo json_encode(['success' => true, 'message' => 'Requirement status updated successfully.']);
    } catch (Exception $e) {
      echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    break;

  // ... (POST and DELETE cases remain unchanged) ...
  case 'POST':
    $action = $_GET['action'] ?? '';
    if ($action === 'reset_weekly_report') {
        try {
            $stmt = $conn->prepare("UPDATE student_requirements sr INNER JOIN requirements r ON sr.requirement_id = r.id SET sr.status = 'Pending', sr.submitted_at = NULL WHERE r.name = 'Weekly Report'");
            $stmt->execute();
            echo json_encode(['success' => true, 'message' => 'Weekly report statuses reset successfully.']);
        } catch (Exception $e) { echo json_encode(['success' => false, 'message' => $e->getMessage()]); }
    } else { echo json_encode(['success' => false, 'message' => 'Invalid action.']); }
    break;

  default:
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    break;
}
?>