<?php
require_once '../../config/db.php';
require_once __DIR__ . '/../../config/cors.php';

header("Content-Type: application/json");
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {

  case 'GET':
    try {
      $stmt = $conn->query("
        SELECT 
          a.id AS advisor_id,
          u.id AS user_id,
          u.name AS full_name,
          u.email,
          u.status AS user_status,
          a.department
        FROM ojt_advisors a
        INNER JOIN users u ON a.user_id = u.id
        ORDER BY a.id DESC
      ");
      echo json_encode(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    } catch (Exception $e) {
      echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    break;

  case 'POST':
    $data = json_decode(file_get_contents("php://input"), true);

    $name = trim($data['name'] ?? '');
    $email = trim($data['email'] ?? '');
    $password = $data['password'] ?? 'advisor123'; // Default password
    $department = trim($data['department'] ?? '');

    if (!$name || !$email) {
      echo json_encode(['success' => false, 'message' => 'Missing required fields (name, email).']);
      exit;
    }

    try {
      $conn->beginTransaction();

      // Check for duplicate email
      $check = $conn->prepare("SELECT id FROM users WHERE email = ?");
      $check->execute([$email]);
      if ($check->fetch()) {
        echo json_encode(['success' => false, 'message' => 'Email already exists.']);
        exit;
      }

      // Create user
      $stmtUser = $conn->prepare("
        INSERT INTO users (name, email, password, role, status)
        VALUES (?, ?, ?, 'Advisor', 'Active')
      ");
      $stmtUser->execute([$name, $email, password_hash($password, PASSWORD_DEFAULT)]);
      $userId = $conn->lastInsertId();

      // Insert into ojt_advisors (with department)
      $stmt = $conn->prepare("INSERT INTO ojt_advisors (user_id, department) VALUES (?, ?)");
      $stmt->execute([$userId, $department ?: null]);

      $conn->commit();
      echo json_encode(['success' => true, 'message' => 'Advisor added successfully.']);
    } catch (Exception $e) {
      $conn->rollBack();
      echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
    break;

  case 'PUT':
    $data = json_decode(file_get_contents("php://input"), true);
    $id = $data['id'] ?? null;
    $department = trim($data['department'] ?? '');

    if (!$id) {
      echo json_encode(['success' => false, 'message' => 'Missing advisor ID.']);
      exit;
    }

    try {
      $stmt = $conn->prepare("UPDATE ojt_advisors SET department = ? WHERE id = ?");
      $stmt->execute([$department ?: null, $id]);
      echo json_encode(['success' => true, 'message' => 'Advisor updated successfully.']);
    } catch (Exception $e) {
      echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
    break;
  case 'DELETE':
    $data = json_decode(file_get_contents("php://input"), true);
    $id = $data['id'] ?? null;

    if (!$id) {
      echo json_encode(['success' => false, 'message' => 'Missing advisor ID.']);
      exit;
    }

    try {
      $conn->beginTransaction();

      $stmt = $conn->prepare("SELECT user_id FROM ojt_advisors WHERE id = ?");
      $stmt->execute([$id]);
      $advisor = $stmt->fetch(PDO::FETCH_ASSOC);

      if ($advisor) {
        $conn->prepare("DELETE FROM ojt_advisors WHERE id = ?")->execute([$id]);
        $conn->prepare("DELETE FROM users WHERE id = ?")->execute([$advisor['user_id']]);
      }

      $conn->commit();
      echo json_encode(['success' => true, 'message' => 'Advisor deleted successfully.']);
    } catch (Exception $e) {
      $conn->rollBack();
      echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
    break;

  default:
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);
    break;
}
?>
