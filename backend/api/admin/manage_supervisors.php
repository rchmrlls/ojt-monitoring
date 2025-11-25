<?php
require_once '../../config/db.php';
require_once __DIR__ . '/../../config/cors.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
  // 📘 GET ALL COMPANY ADVISORS
  case 'GET':
    $stmt = $conn->query("
      SELECT 
        ca.id,
        ca.position,
        u.id AS user_id,
        u.name AS full_name,
        u.email,
        u.status AS user_status,
        c.id AS company_id,
        c.name AS company_name
      FROM company_advisors ca
      JOIN users u ON ca.user_id = u.id
      LEFT JOIN companies c ON ca.company_id = c.id
      ORDER BY ca.id DESC
    ");
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    break;

  // 🟢 ADD NEW SUPERVISOR
  case 'POST':
    $data = json_decode(file_get_contents("php://input"), true);
    $userId = $data['user_id'];
    $companyId = $data['company_id'] ?? null;
    $position = $data['position'] ?? null;

    $stmt = $conn->prepare("INSERT INTO company_advisors (user_id, company_id, position) VALUES (?, ?, ?)");
    $stmt->execute([$userId, $companyId, $position]);
    echo json_encode(['success' => true, 'message' => 'Company advisor added successfully.']);
    break;

  // 🟡 UPDATE SUPERVISOR
  case 'PUT':
    $data = json_decode(file_get_contents("php://input"), true);
    $id = $data['id'];
    $companyId = $data['company_id'] ?? null;
    $position = $data['position'] ?? null;

    $stmt = $conn->prepare("UPDATE company_advisors SET company_id=?, position=? WHERE id=?");
    $stmt->execute([$companyId, $position, $id]);
    echo json_encode(['success' => true, 'message' => 'Company advisor updated successfully.']);
    break;

  // 🔴 DELETE SUPERVISOR
  case 'DELETE':
    parse_str(file_get_contents("php://input"), $data);
    $id = $data['id'];

    $stmt = $conn->prepare("DELETE FROM company_advisors WHERE id=?");
    $stmt->execute([$id]);
    echo json_encode(['success' => true, 'message' => 'Company advisor deleted successfully.']);
    break;
}
?>
