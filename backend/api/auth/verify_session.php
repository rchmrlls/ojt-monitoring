<?php
session_start();
if (isset($_SESSION['user_id'])) {
  echo json_encode([
    "logged_in" => true,
    "user" => [
      "id" => $_SESSION['user_id'],
      "name" => $_SESSION['name'],
      "role" => $_SESSION['role']
    ]
  ]);
} else {
  echo json_encode(["logged_in" => false]);
}
?>
