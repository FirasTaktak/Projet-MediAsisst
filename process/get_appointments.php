<?php
session_start();
require_once '../includes/Session.php';
Session::requireLogin();
require_once '../config/database.php';

header('Content-Type: application/json');

// Enable detailed error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display in response, but log them
ini_set('log_errors', 1);

$auth_id = $_SESSION['auth_id'] ?? null;
if (!$auth_id) {
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

try {
    $database = new Database();
    $db = $database->getConnection();

    // Log the auth_id for debugging
    error_log("Fetching appointments for auth_id: $auth_id");

    // Check if a specific appointment ID is requested
    if (isset($_GET['id'])) {
        $appt_id = (int)$_GET['id'];
        $stmt = $db->prepare("SELECT * FROM appointments WHERE id = ? AND auth_id = ?");
        $stmt->execute([$appt_id, $auth_id]);
        $appointment = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($appointment) {
            echo json_encode(['success' => true, 'appointment' => $appointment]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Appointment not found']);
        }
    } else {
        // Get all appointments for the user, sorted by date
        $stmt = $db->prepare("
            SELECT * FROM appointments 
            WHERE auth_id = ? 
            ORDER BY appointment_date, appointment_time
        ");
        $stmt->execute([$auth_id]);
        $appointments = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Log the number of appointments found
        error_log("Found " . count($appointments) . " appointments for user $auth_id");
        
        echo json_encode([
            'success' => true, 
            'appointments' => $appointments,
            'count' => count($appointments)
        ]);
    }
} catch (Exception $e) {
    error_log("Error fetching appointments: " . $e->getMessage() . "\n" . $e->getTraceAsString());
    echo json_encode([
        'success' => false, 
        'message' => 'Error fetching appointments',
        'error' => $e->getMessage()
    ]);
}
?>