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
    
    // Validate medication ID
    if (!isset($_POST['med_id']) || !is_numeric($_POST['med_id'])) {
        throw new Exception("Invalid medication ID");
    }
    
    $med_id = (int)$_POST['med_id'];
    
    // Verify the medication belongs to the authenticated user
    $stmt = $db->prepare("SELECT id FROM medications WHERE id = ? AND auth_id = ?");
    $stmt->execute([$med_id, $auth_id]);
    
    if (!$stmt->fetch()) {
        throw new Exception("Medication not found or you don't have permission to delete it");
    }
    
    // Begin transaction
    $db->beginTransaction();
    
    try {
        // Delete related notifications first
        $stmt = $db->prepare("DELETE FROM notifications WHERE reference_id = ? AND type = 'medication'");
        $stmt->execute([$med_id]);
        
        // Delete the medication
        $stmt = $db->prepare("DELETE FROM medications WHERE id = ? AND auth_id = ?");
        $result = $stmt->execute([$med_id, $auth_id]);
        
        if (!$result) {
            throw new Exception("Failed to delete medication");
        }
        
        // Commit transaction
        $db->commit();
        
        echo json_encode(['success' => true, 'message' => 'Medication deleted successfully']);
    } catch (Exception $e) {
        // Rollback transaction on error
        $db->rollBack();
        throw $e;
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>