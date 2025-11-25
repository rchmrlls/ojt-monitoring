<?php
require_once '../../config/db.php';
require_once __DIR__ . '/../../config/cors.php';

header("Content-Type: application/json");
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {

  // =========================================================
  // GET: Fetch all companies
  // =========================================================
  case 'GET':
    try {
      $stmt = $conn->query("SELECT * FROM companies ORDER BY id DESC");
      echo json_encode(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    } catch (Exception $e) {
      echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    break;

  // =========================================================
  // POST: Add new company
  // =========================================================
  case 'POST':
    $data = json_decode(file_get_contents("php://input"), true);
    $name = trim($data['name'] ?? '');
    $address = $data['address'] ?? '';
    $contactPerson = $data['contact_person'] ?? '';
    $contactNo = $data['contact_no'] ?? '';
    $email = $data['email'] ?? '';
    $status = $data['status'] ?? 'Active';

    if (!$name) {
      echo json_encode(['success' => false, 'message' => 'Company name is required.']);
      exit;
    }

    try {
      $stmt = $conn->prepare("
        INSERT INTO companies (name, address, contact_person, contact_no, email, status)
        VALUES (?, ?, ?, ?, ?, ?)
      ");
      $stmt->execute([$name, $address, $contactPerson, $contactNo, $email, $status]);
      echo json_encode(['success' => true, 'message' => 'Company added successfully.']);
    } catch (Exception $e) {
      echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    break;

  // =========================================================
  // PUT: Update existing company
  // =========================================================
  case 'PUT':
    $data = json_decode(file_get_contents("php://input"), true);
    $id = $data['id'] ?? null;

    if (!$id) {
      echo json_encode(['success' => false, 'message' => 'Missing company ID.']);
      exit;
    }

    $name = trim($data['name'] ?? '');
    $address = $data['address'] ?? '';
    $contactPerson = $data['contact_person'] ?? '';
    $contactNo = $data['contact_no'] ?? '';
    $email = $data['email'] ?? '';
    $status = $data['status'] ?? 'Active';

    try {
      $stmt = $conn->prepare("
        UPDATE companies
        SET name=?, address=?, contact_person=?, contact_no=?, email=?, status=?
        WHERE id=?
      ");
      $stmt->execute([$name, $address, $contactPerson, $contactNo, $email, $status, $id]);
      echo json_encode(['success' => true, 'message' => 'Company updated successfully.']);
    } catch (Exception $e) {
      echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    break;

  // =========================================================
  // DELETE: Remove company
  // =========================================================
  case 'DELETE':
    $data = json_decode(file_get_contents("php://input"), true);
    $id = $data['id'] ?? null;

    if (!$id) {
      echo json_encode(['success' => false, 'message' => 'Missing company ID.']);
      exit;
    }

    try {
      $stmt = $conn->prepare("DELETE FROM companies WHERE id=?");
      $stmt->execute([$id]);
      echo json_encode(['success' => true, 'message' => 'Company deleted successfully.']);
    } catch (Exception $e) {
      echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    break;

  default:
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);
    break;
}
?>
