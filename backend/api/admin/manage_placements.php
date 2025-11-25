<?php
require_once '../../config/db.php';
require_once __DIR__ . '/../../config/cors.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
  // 📘 GET ALL PLACEMENTS
  case 'GET':
    $stmt = $conn->query("
      SELECT 
        p.id,
        p.start_date,
        p.end_date,
        p.remarks,
        p.status,
        s.id AS student_id,
        u.name AS student_name,
        c.id AS company_id,
        c.name AS company_name,
        a.id AS advisor_id,
        ua.name AS advisor_name
      FROM placements p
      JOIN students s ON p.student_id = s.id
      JOIN users u ON s.user_id = u.id
      JOIN companies c ON p.company_id = c.id
      JOIN ojt_advisors a ON p.advisor_id = a.id
      JOIN users ua ON a.user_id = ua.id
      ORDER BY p.id DESC
    ");
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    break;

  // 🟢 ADD NEW PLACEMENT
  case 'POST':
    $data = json_decode(file_get_contents("php://input"), true);
    $studentId = $data['student_id'];
    $companyId = $data['company_id'];
    $advisorId = $data['advisor_id'];
    $start = $data['start_date'] ?? null;
    $end = $data['end_date'] ?? null;
    $remarks = $data['remarks'] ?? null;
    $status = $data['status'] ?? 'Pending';

    $stmt = $conn->prepare("
      INSERT INTO placements (student_id, company_id, advisor_id, start_date, end_date, remarks, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([$studentId, $companyId, $advisorId, $start, $end, $remarks, $status]);
    echo json_encode(['success' => true, 'message' => 'Placement added successfully.']);
    break;

  // 🟡 UPDATE PLACEMENT
  case 'PUT':
    $data = json_decode(file_get_contents("php://input"), true);
    $id = $data['id'];
    $studentId = $data['student_id'];
    $companyId = $data['company_id'];
    $advisorId = $data['advisor_id'];
    $start = $data['start_date'] ?? null;
    $end = $data['end_date'] ?? null;
    $remarks = $data['remarks'] ?? null;
    $status = $data['status'] ?? 'Pending';

    $stmt = $conn->prepare("
      UPDATE placements 
      SET student_id=?, company_id=?, advisor_id=?, start_date=?, end_date=?, remarks=?, status=? 
      WHERE id=?
    ");
    $stmt->execute([$studentId, $companyId, $advisorId, $start, $end, $remarks, $status, $id]);
    echo json_encode(['success' => true, 'message' => 'Placement updated successfully.']);
    break;

  // 🔴 DELETE PLACEMENT
  case 'DELETE':
    parse_str(file_get_contents("php://input"), $data);
    $id = $data['id'];

    $stmt = $conn->prepare("DELETE FROM placements WHERE id=?");
    $stmt->execute([$id]);
    echo json_encode(['success' => true, 'message' => 'Placement deleted successfully.']);
    break;
}
?>
