<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
require_once("../config/db.php");

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->student_id)) {
  echo json_encode(["success" => false, "message" => "Student ID required"]);
  exit;
}

$student_id = $conn->real_escape_string($data->student_id);
$date = date("Y-m-d");

$check = $conn->query("SELECT * FROM attendance WHERE student_id='$student_id' AND date='$date'");
if ($check->num_rows > 0) {
  echo json_encode(["success" => false, "message" => "Already logged today"]);
  exit;
}

$sql = "INSERT INTO attendance (student_id, date, status) VALUES ('$student_id', '$date', 'pending')";
if ($conn->query($sql)) {
  echo json_encode(["success" => true, "message" => "Attendance recorded"]);
} else {
  echo json_encode(["success" => false, "message" => "Failed to log attendance"]);
}
?>
