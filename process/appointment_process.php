<?php
session_start();
require_once '../includes/Session.php';
Session::requireLogin();
require_once '../config/database.php';

header('Content-Type: application/json');

// Generate CSRF token if not exists
if (!isset($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

// Log the received data for debugging
error_log("Appointment process received: " . json_encode($_POST));
error_log("Appointment process method: " . $_SERVER['REQUEST_METHOD']);

$auth_id = $_SESSION['auth_id'] ?? null;
if (!$auth_id) {
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

// CSRF token validation
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($_POST['csrf_token']) || $_POST['csrf_token'] !== $_SESSION['csrf_token']) {
        error_log("CSRF token validation failed");
        echo json_encode(['success' => false, 'message' => 'Invalid request: CSRF validation failed']);
        exit;
    }
}

$database = new Database();
$db = $database->getConnection();

// Handle different actions (add, edit, delete)
$action = $_POST['action'] ?? 'add';
error_log("Appointment action: $action");

// Delete appointment
if ($action === 'delete' && isset($_POST['appt_id'])) {
    $appt_id = $_POST['appt_id'];
    
    try {
        // Verify the appointment belongs to the user
        $checkStmt = $db->prepare("SELECT id FROM appointments WHERE id = ? AND auth_id = ?");
        $checkStmt->execute([$appt_id, $auth_id]);
        
        if ($checkStmt->rowCount() === 0) {
            echo json_encode(['success' => false, 'message' => 'Appointment not found or not authorized']);
            exit;
        }
        
        // Delete the appointment
        $deleteStmt = $db->prepare("DELETE FROM appointments WHERE id = ? AND auth_id = ?");
        $deleteStmt->execute([$appt_id, $auth_id]);
        
        echo json_encode(['success' => true, 'message' => 'Appointment deleted successfully']);
        exit;
    } catch (Exception $e) {
        error_log("Error deleting appointment: " . $e->getMessage());
        echo json_encode([
            'success' => false, 
            'message' => 'Error deleting appointment', 
            'error_details' => $e->getMessage()
        ]);
        exit;
    }
}

// Add or edit appointment
if ($action === 'add' || $action === 'edit') {
    // Validate required fields
    $required = ['appointment_type', 'doctor_name', 'appointment_date', 'appointment_time'];
    foreach ($required as $field) {
        if (!isset($_POST[$field]) || empty($_POST[$field])) {
            echo json_encode([
                'success' => false, 
                'message' => "Missing required field: $field",
                'received_data' => $_POST
            ]);
            exit;
        }
    }
    
    // Get form data
    $appt_id = isset($_POST['appt_id']) && !empty($_POST['appt_id']) ? (int)$_POST['appt_id'] : null;
    $appointment_type = trim($_POST['appointment_type']);
    $doctor_name = trim($_POST['doctor_name']);
    $appointment_date = trim($_POST['appointment_date']);
    $appointment_time = trim($_POST['appointment_time']);
    $location = isset($_POST['location']) ? trim($_POST['location']) : null;
    $reminder_time = isset($_POST['reminder_time']) ? (int)$_POST['reminder_time'] : 30;
    $notes = isset($_POST['notes']) ? trim($_POST['notes']) : null;
    
    try {
        // Start transaction
        $db->beginTransaction();
        
        if ($action === 'edit' && $appt_id) {
            // Verify the appointment belongs to the user before updating
            $checkStmt = $db->prepare("SELECT id FROM appointments WHERE id = ? AND auth_id = ?");
            $checkStmt->execute([$appt_id, $auth_id]);
            
            if ($checkStmt->rowCount() === 0) {
                $db->rollBack();
                echo json_encode([
                    'success' => false, 
                    'message' => 'Appointment not found or not authorized',
                    'appt_id' => $appt_id,
                    'auth_id' => $auth_id
                ]);
                exit;
            }
            
            // Update existing appointment
            $stmt = $db->prepare("UPDATE appointments SET 
                appointment_type = ?, 
                doctor_name = ?, 
                appointment_date = ?, 
                appointment_time = ?, 
                location = ?, 
                reminder_time = ?, 
                notes = ?
                WHERE id = ? AND auth_id = ?");
            
            $result = $stmt->execute([
                $appointment_type, 
                $doctor_name, 
                $appointment_date, 
                $appointment_time, 
                $location, 
                $reminder_time, 
                $notes,
                $appt_id,
                $auth_id
            ]);
            
            if ($result && $stmt->rowCount() > 0) {
                $db->commit();
                echo json_encode(['success' => true, 'message' => 'Appointment updated successfully']);
            } else {
                $errorInfo = $stmt->errorInfo();
                error_log("SQL Error: " . json_encode($errorInfo));
                $db->rollBack();
                echo json_encode([
                    'success' => false, 
                    'message' => 'Failed to update appointment',
                    'sql_error' => $errorInfo[2],
                    'error_code' => $errorInfo[0]
                ]);
            }
        } else {
            // Add new appointment
            $stmt = $db->prepare("INSERT INTO appointments 
                (auth_id, appointment_type, doctor_name, appointment_date, appointment_time, location, reminder_time, notes, created_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())");
            
            $params = [
                $auth_id,
                $appointment_type, 
                $doctor_name, 
                $appointment_date, 
                $appointment_time, 
                $location, 
                $reminder_time, 
                $notes
            ];
            
            // Log the query parameters
            error_log("Insert appointment params: " . json_encode($params));
            
            $result = $stmt->execute($params);
            
            if ($result) {
                $newId = $db->lastInsertId();
                $db->commit();
                echo json_encode([
                    'success' => true, 
                    'message' => 'Appointment added successfully',
                    'appt_id' => $newId
                ]);
            } else {
                $errorInfo = $stmt->errorInfo();
                error_log("SQL Error: " . json_encode($errorInfo));
                $db->rollBack();
                echo json_encode([
                    'success' => false, 
                    'message' => 'Failed to add appointment',
                    'sql_error' => $errorInfo[2],
                    'error_code' => $errorInfo[0],
                    'params' => $params
                ]);
            }
        }
    } catch (Exception $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        error_log("Error saving appointment: " . $e->getMessage() . "\n" . $e->getTraceAsString());
        echo json_encode([
            'success' => false, 
            'message' => 'Error saving appointment', 
            'error_details' => $e->getMessage(),
            'error_trace' => $e->getTraceAsString(),
            'received_data' => $_POST
        ]);
    }
    exit;
}

// If we get here, no valid action was specified
echo json_encode([
    'success' => false, 
    'message' => 'Invalid action',
    'received_action' => $action,
    'received_data' => $_POST
]);
?>