<?php
require_once '../../config/db.php';
require_once '../../config/cors.php';

header("Content-Type: application/json");

$user_id = $_GET['user_id'] ?? null;
if (!$user_id) {
    echo json_encode(['success' => false, 'message' => 'Missing user_id']);
    exit;
}

$stmt = $conn->prepare("SELECT id FROM students WHERE user_id = ?");
$stmt->execute([$user_id]);
$student = $stmt->fetch(PDO::FETCH_ASSOC);

if ($student) {
    echo json_encode(['success' => true, 'student_id' => $student['id']]);
} else {
    echo json_encode(['success' => false, 'message' => 'Student not found']);
}
