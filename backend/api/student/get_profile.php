<?php
require_once '../../config/db.php';
require_once '../../config/cors.php';

header("Content-Type: application/json; charset=UTF-8");

// Get student_id from query parameters
$student_id = $_GET['id'] ?? null;

if (!$student_id) {
    echo json_encode(['success' => false, 'message' => 'Missing student ID.']);
    exit;
}

try {
    // Fetch student info
    $stmt = $conn->prepare("
        SELECT 
            s.id AS student_id,
            u.id AS user_id,
            u.name,
            u.email,
            s.student_no,
            s.course,
            s.year_level,
            s.section,
            s.contact_no,
            s.address,
            s.deployment_status,
            c.name AS company_name
        FROM students s
        INNER JOIN users u ON s.user_id = u.id
        LEFT JOIN companies c ON s.company_id = c.id
        WHERE s.id = ?  -- Use students.id, not users.id
    ");
    $stmt->execute([$student_id]);
    $student = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($student) {
        echo json_encode(['success' => true, 'data' => $student]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Student not found.']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>
