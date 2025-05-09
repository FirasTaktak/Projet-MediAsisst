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
    
    // Validate appointment ID
    if (!isset($_POST['appointment_id']) || !is_numeric($_POST['appointment_id'])) {
        throw new Exception("Invalid appointment ID");
    }
    
    $appointment_id = (int)$_POST['appointment_id'];
    
    // Verify the appointment belongs to the authenticated user
    $stmt = $db->prepare("SELECT id FROM appointments WHERE id = ? AND auth_id = ?");
    $stmt->execute([$appointment_id, $auth_id]);
    
    if (!$stmt->fetch()) {
        throw new Exception("Appointment not found or you don't have permission to delete it");
    }
    
    // Begin transaction
    $db->beginTransaction();
    
    try {
        // Delete the appointment
        $stmt = $db->prepare("DELETE FROM appointments WHERE id = ? AND auth_id = ?");
        $result = $stmt->execute([$appointment_id, $auth_id]);
        
        if (!$result) {
            throw new Exception("Failed to delete appointment");
        }
        
        // Commit transaction
        $db->commit();
        
        echo json_encode(['success' => true, 'message' => 'Appointment deleted successfully']);
    } catch (Exception $e) {
        // Rollback transaction on error
        $db->rollBack();
        throw $e;
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>