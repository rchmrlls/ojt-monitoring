<?php
require_once '../../config/db.php';
require_once __DIR__ . '/../../config/cors.php';

header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
    exit;
}

// Validate input
$student_id = $_POST['student_id'] ?? null;
$requirement_id = $_POST['requirement_id'] ?? null;
$file = $_FILES['file'] ?? null;

if (!$student_id || !$requirement_id || !$file) {
    echo json_encode(['success' => false, 'message' => 'Missing required fields.']);
    exit;
}

try {
    // Check student
    $stmtStudent = $conn->prepare("SELECT id FROM students WHERE id = ?");
    $stmtStudent->execute([$student_id]);
    if (!$stmtStudent->fetchColumn()) {
        echo json_encode(['success' => false, 'message' => 'Invalid student_id.']);
        exit;
    }

    // Check upload directory
    $uploadDir = __DIR__ . '/../../uploads/student_requirements/';
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    // original filename
    $originalName = basename($file['name']);
    $safeFileName = preg_replace("/[^a-zA-Z0-9_\.-]/", "_", $originalName);

    // prevent overwriting
    $uploadPath = $uploadDir . $safeFileName;
    if (file_exists($uploadPath)) {
        $fileBase = pathinfo($safeFileName, PATHINFO_FILENAME);
        $fileExt = pathinfo($safeFileName, PATHINFO_EXTENSION);
        $safeFileName = $fileBase . '_' . time() . '.' . $fileExt;
        $uploadPath = $uploadDir . $safeFileName;
    }

    // Move uploaded file
    if (!move_uploaded_file($file['tmp_name'], $uploadPath)) {
        echo json_encode(['success' => false, 'message' => 'Failed to upload file.']);
        exit;
    }

    $filePathForDB = 'uploads/student_requirements/' . $safeFileName;

    // Check record
    $checkStmt = $conn->prepare("SELECT id FROM student_requirements WHERE student_id = ? AND requirement_id = ?");
    $checkStmt->execute([$student_id, $requirement_id]);
    $exists = $checkStmt->fetchColumn();

    if ($exists) {
        $stmt = $conn->prepare("
            UPDATE student_requirements 
            SET file_path = ?, status = 'Submitted', uploaded_at = NOW()
            WHERE student_id = ? AND requirement_id = ?
        ");
        $stmt->execute([$filePathForDB, $student_id, $requirement_id]);
    } else {
        $stmt = $conn->prepare("
            INSERT INTO student_requirements (student_id, requirement_id, file_path, status, uploaded_at)
            VALUES (?, ?, ?, 'Submitted', NOW())
        ");
        $stmt->execute([$student_id, $requirement_id, $filePathForDB]);
    }

    echo json_encode([
        'success' => true,
        'message' => 'File uploaded successfully.',
        'file_path' => $filePathForDB
    ]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
