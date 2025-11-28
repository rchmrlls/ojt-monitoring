<?php
require_once '../../config/db.php';
require_once __DIR__ . '/../../config/cors.php';

header("Content-Type: application/json");
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {

  // GET: Fetch all students with requirement counts
  case 'GET':
        try {
            // Subquery to count total mandatory requirements (global)
            $totalMandatorySql = "(SELECT COUNT(*) FROM requirements WHERE is_required = 1)";

            // Main query
            $sql = "
                SELECT 
                    s.id AS student_id,
                    s.student_no,
                    s.course,
                    s.year_level,
                    s.section,
                    s.company_id,
                    s.deployment_status,
                    u.name AS full_name,
                    u.email,
                    c.name AS company_name,
                    
                    -- Count Pending Files (for the 'Review Now' button logic)
                    (SELECT COUNT(*) FROM student_requirements sr 
                     WHERE sr.student_id = s.id AND sr.status = 'Submitted') as pending_files,

                    -- Count Submitted/Completed Mandatory Files (for Progress)
                    (SELECT COUNT(*) 
                     FROM student_requirements sr 
                     JOIN requirements r ON sr.requirement_id = r.id
                     WHERE sr.student_id = s.id 
                       AND r.is_required = 1 
                       AND sr.status IN ('Submitted', 'Completed')
                    ) as submitted_mandatory,

                    -- Total Mandatory Requirements
                    $totalMandatorySql as total_mandatory

                FROM students s
                JOIN users u ON s.user_id = u.id
                LEFT JOIN companies c ON s.company_id = c.id
                ORDER BY pending_files DESC, u.name ASC
            ";
            
            $stmt = $conn->prepare($sql);
            $stmt->execute();
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode(['success' => true, 'data' => $data]);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        break;

  // ... (Rest of the file: POST, PUT, DELETE cases remain unchanged) ...
  // Keep the existing POST, PUT, DELETE logic here. 
  // Only the GET query above is modified.
  
  // POST: Add new student
  case 'POST':
    $data = json_decode(file_get_contents("php://input"), true);

    $name = trim($data['name'] ?? '');
    $email = trim($data['email'] ?? '');
    $password = $data['password'] ?? 'student123';
    $studentNo = trim($data['student_no'] ?? '');
    $course = $data['course'] ?? '';
    $year = $data['year_level'] ?? '';
    $section = $data['section'] ?? '';
    $contact = $data['contact_no'] ?? '';
    $address = $data['address'] ?? '';
    $company = !empty($data['company_id']) ? $data['company_id'] : null;
    $deployment = $data['deployment_status'] ?? 'Not Deployed';

    if (!$name || !$email || !$studentNo) {
      echo json_encode(['success' => false, 'message' => 'Missing required fields: name, email, or student_no.']);
      exit;
    }

    try {
      $checkEmail = $conn->prepare("SELECT id FROM users WHERE email = ?");
      $checkEmail->execute([$email]);
      if ($checkEmail->fetch()) {
        echo json_encode(['success' => false, 'message' => 'Email already exists.']);
        exit;
      }

      $checkStudent = $conn->prepare("SELECT id FROM students WHERE student_no = ?");
      $checkStudent->execute([$studentNo]);
      if ($checkStudent->fetch()) {
        echo json_encode(['success' => false, 'message' => 'Student number already exists.']);
        exit;
      }

      if ($company) {
        $checkCompany = $conn->prepare("SELECT id FROM companies WHERE id = ?");
        $checkCompany->execute([$company]);
        if (!$checkCompany->fetch()) {
          echo json_encode(['success' => false, 'message' => 'Invalid company ID.']);
          exit;
        }
      }

      $conn->beginTransaction();

      $stmtUser = $conn->prepare("
        INSERT INTO users (name, email, password, role, status)
        VALUES (?, ?, ?, 'Student', 'Active')
      ");
      $stmtUser->execute([$name, $email, password_hash($password, PASSWORD_DEFAULT)]);
      $userId = $conn->lastInsertId();

      $stmtStudent = $conn->prepare("
        INSERT INTO students 
        (user_id, student_no, course, year_level, section, contact_no, address, company_id, deployment_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ");
      $stmtStudent->execute([$userId, $studentNo, $course, $year, $section, $contact, $address, $company, $deployment]);

      $conn->commit();
      echo json_encode(['success' => true, 'message' => 'Student added successfully.']);
    } catch (Exception $e) {
      $conn->rollBack();
      echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
    break;

  // PUT: Update student
  case 'PUT':
      $data = json_decode(file_get_contents("php://input"), true);
      $id = $data['id'] ?? null;

      if (!$id) {
          echo json_encode(['success' => false, 'message' => 'Missing student ID.']);
          exit;
      }

      try {
          $conn->beginTransaction();

          $stmt = $conn->prepare("SELECT * FROM students WHERE id = ?");
          $stmt->execute([$id]);
          $student = $stmt->fetch(PDO::FETCH_ASSOC);

          if (!$student) {
              echo json_encode(['success' => false, 'message' => 'Student not found.']);
              exit;
          }

          $userId = $student['user_id'];

          if (isset($data['deployment_status']) && count($data) === 2) {
              $stmt = $conn->prepare("UPDATE students SET deployment_status=? WHERE id=?");
              $stmt->execute([$data['deployment_status'], $id]);
              $conn->commit();
              echo json_encode(['success' => true, 'message' => 'Deployment status updated successfully.']);
              exit;
          }

          $name = trim($data['name'] ?? '');
          $email = trim($data['email'] ?? '');
          $course = $data['course'] ?? $student['course'];
          $year = $data['year_level'] ?? $student['year_level'];
          $section = $data['section'] ?? $student['section'];
          $contact = $data['contact_no'] ?? $student['contact_no'];
          $address = $data['address'] ?? $student['address'];
          $company = array_key_exists('company_id', $data) ? $data['company_id'] : $student['company_id'];
          $deployment = $data['deployment_status'] ?? $student['deployment_status'];

          $stmt = $conn->prepare("
              UPDATE students
              SET course=?, year_level=?, section=?, contact_no=?, address=?, company_id=?, deployment_status=?
              WHERE id=?
          ");
          $stmt->execute([$course, $year, $section, $contact, $address, $company, $deployment, $id]);

          if ($name || $email) {
              $stmtUser = $conn->prepare("
                  UPDATE users
                  SET name = COALESCE(?, name), email = COALESCE(?, email)
                  WHERE id = ?
              ");
              $stmtUser->execute([$name ?: null, $email ?: null, $userId]);
          }

          $conn->commit();
          echo json_encode(['success' => true, 'message' => 'Student and user updated successfully.']);
      } catch (Exception $e) {
          $conn->rollBack();
          echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
      }
      break;

  // DELETE: Remove student
  case 'DELETE':
  $data = json_decode(file_get_contents("php://input"), true);
  $id = $data['id'] ?? null;

  if (!$id) {
    echo json_encode(['success' => false, 'message' => 'Missing student ID.']);
    exit;
  }

  try {
    $conn->beginTransaction();

    $stmt = $conn->prepare("SELECT user_id FROM students WHERE id=?");
    $stmt->execute([$id]);
    $student = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($student) {
      $conn->prepare("DELETE FROM students WHERE id=?")->execute([$id]);
      $conn->prepare("DELETE FROM users WHERE id=?")->execute([$student['user_id']]);
    }

    $conn->commit();
    echo json_encode(['success' => true, 'message' => 'Student deleted successfully.']);
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