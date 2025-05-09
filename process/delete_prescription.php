<?php
session_start();
require_once '../includes/Session.php';
Session::requireLogin();
require_once '../config/database.php';

header('Content-Type: application/json');

$auth_id = $_SESSION['auth_id'] ?? null;
if (!$auth_id) {
    echo json_encode(['success' => false, 'message' => 'Authentication required']);
    exit;
}

// Only process POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Validate prescription ID
    if (!isset($_POST['prescription_id']) || !is_numeric($_POST['prescription_id'])) {
        throw new Exception("Invalid prescription ID");
    }
    
    $prescription_id = (int)$_POST['prescription_id'];
    
    // Verify the prescription belongs to the authenticated user
    $stmt = $db->prepare("SELECT id FROM prescriptions WHERE id = ? AND auth_id = ?");
    $stmt->execute([$prescription_id, $auth_id]);
    
    if (!$stmt->fetch()) {
        throw new Exception("Prescription not found or you don't have permission to delete it");
    }
    
    // Delete the prescription
    $stmt = $db->prepare("DELETE FROM prescriptions WHERE id = ? AND auth_id = ?");
    $result = $stmt->execute([$prescription_id, $auth_id]);
    
    if ($result) {
        echo json_encode(['success' => true, 'message' => 'Prescription deleted successfully']);
    } else {
        throw new Exception("Failed to delete prescription");
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>