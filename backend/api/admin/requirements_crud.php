<?php
require_once '../../config/db.php';
require_once __DIR__ . '/../../config/cors.php';

header("Content-Type: application/json");

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents("php://input"), true);

switch ($method) {
    // 📘 GET: Fetch All Requirements
    case 'GET':
        try {
            // Select is_required instead of type
            $stmt = $conn->query("SELECT id, name, description, is_required FROM requirements ORDER BY id ASC");
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['success' => true, 'data' => $data]);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        break;

    // 🟢 POST: Add New Requirement
    case 'POST':
        $name = trim($input['name'] ?? '');
        $description = trim($input['description'] ?? '');
        // Map frontend 'Mandatory'/'Optional' or boolean to 1/0
        $isRequired = (isset($input['is_required']) && $input['is_required'] == 1) ? 1 : 0;

        if (!$name) {
            echo json_encode(['success' => false, 'message' => 'Requirement name is required.']);
            exit;
        }

        try {
            $stmt = $conn->prepare("INSERT INTO requirements (name, description, is_required) VALUES (?, ?, ?)");
            $stmt->execute([$name, $description, $isRequired]);
            echo json_encode(['success' => true, 'message' => 'Requirement added successfully.']);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        break;

    // 🟡 PUT: Update Requirement
    case 'PUT':
        $id = $input['id'] ?? null;
        $name = trim($input['name'] ?? '');
        $description = trim($input['description'] ?? '');
        $isRequired = (isset($input['is_required']) && $input['is_required'] == 1) ? 1 : 0;

        if (!$id || !$name) {
            echo json_encode(['success' => false, 'message' => 'ID and Name are required.']);
            exit;
        }

        try {
            $stmt = $conn->prepare("UPDATE requirements SET name = ?, description = ?, is_required = ? WHERE id = ?");
            $stmt->execute([$name, $description, $isRequired, $id]);
            echo json_encode(['success' => true, 'message' => 'Requirement updated successfully.']);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        break;

    // 🔴 DELETE: Remove Requirement
    case 'DELETE':
        $id = $input['id'] ?? $_GET['id'] ?? null;

        if (!$id) {
            echo json_encode(['success' => false, 'message' => 'Requirement ID missing.']);
            exit;
        }

        try {
            $stmt = $conn->prepare("DELETE FROM requirements WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true, 'message' => 'Requirement deleted successfully.']);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        break;
}
?>