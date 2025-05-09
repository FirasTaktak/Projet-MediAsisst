<?php
session_start();
require_once '../includes/Session.php';
Session::requireLogin();
require_once '../config/database.php';

header('Content-Type: application/json');

$auth_id = $_SESSION['auth_id'] ?? null;
if (!$auth_id) {
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

$database = new Database();
$db = $database->getConnection();

// GET request - fetch all contacts
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $db->prepare("SELECT id, name, phone, relationship FROM emergency_contacts WHERE auth_id = ? ORDER BY name ASC");
        $stmt->execute([$auth_id]);
        $contacts = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'contacts' => $contacts]);
        exit;
    } catch (Exception $e) {
        error_log("Error fetching emergency contacts: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Error loading emergency contacts']);
        exit;
    }
}

// POST request - add, edit, delete contacts
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Log the received data for debugging
    error_log("Emergency contacts process received: " . json_encode($_POST));
    
    $action = $_POST['action'] ?? 'add';
    
    // Delete contact
    if ($action === 'delete' && isset($_POST['contact_id'])) {
        $contact_id = $_POST['contact_id'];
        
        try {
            // Verify the contact belongs to the user
            $checkStmt = $db->prepare("SELECT id FROM emergency_contacts WHERE id = ? AND auth_id = ?");
            $checkStmt->execute([$contact_id, $auth_id]);
            
            if ($checkStmt->rowCount() === 0) {
                echo json_encode(['success' => false, 'message' => 'Contact not found or not authorized']);
                exit;
            }
            
            // Delete the contact
            $deleteStmt = $db->prepare("DELETE FROM emergency_contacts WHERE id = ? AND auth_id = ?");
            $deleteStmt->execute([$contact_id, $auth_id]);
            
            echo json_encode(['success' => true, 'message' => 'Contact deleted successfully']);
            exit;
        } catch (Exception $e) {
            error_log("Error deleting emergency contact: " . $e->getMessage());
            echo json_encode(['success' => false, 'message' => 'Error deleting contact']);
            exit;
        }
    }
    
    // Add or edit contact
    if ($action === 'add' || $action === 'edit') {
        // Validate required fields
        $required = ['name', 'phone', 'relationship'];
        foreach ($required as $field) {
            if (!isset($_POST[$field]) || empty($_POST[$field])) {
                echo json_encode(['success' => false, 'message' => "Missing required field: $field"]);
                exit;
            }
        }
        
        // Get form data
        $contact_id = isset($_POST['contact_id']) && !empty($_POST['contact_id']) ? (int)$_POST['contact_id'] : null;
        $name = trim($_POST['name']);
        $phone = trim($_POST['phone']);
        $relationship = trim($_POST['relationship']);
        
        try {
            // Add new contact
            if ($action === 'add') {
                $stmt = $db->prepare("INSERT INTO emergency_contacts (auth_id, name, phone, relationship) 
                                      VALUES (?, ?, ?, ?)");
                $result = $stmt->execute([$auth_id, $name, $phone, $relationship]);
                
                if ($result) {
                    echo json_encode([
                        'success' => true, 
                        'message' => 'Emergency contact added successfully',
                        'contact_id' => $db->lastInsertId()
                    ]);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Failed to add emergency contact']);
                }
                exit;
            }
            
            // Edit existing contact
            if ($action === 'edit') {
                if (!$contact_id) {
                    echo json_encode(['success' => false, 'message' => 'Contact ID is required for editing']);
                    exit;
                }
                
                // Log the edit attempt
                error_log("Attempting to edit contact ID: $contact_id for auth_id: $auth_id");
                
                // Verify the contact belongs to the user
                $checkStmt = $db->prepare("SELECT id FROM emergency_contacts WHERE id = ? AND auth_id = ?");
                $checkStmt->execute([$contact_id, $auth_id]);
                
                if ($checkStmt->rowCount() === 0) {
                    echo json_encode(['success' => false, 'message' => 'Contact not found or not authorized']);
                    exit;
                }
                
                $stmt = $db->prepare("UPDATE emergency_contacts SET name = ?, phone = ?, relationship = ? WHERE id = ? AND auth_id = ?");
                $stmt->execute([$name, $phone, $relationship, $contact_id, $auth_id]);
                
                if ($stmt->rowCount() > 0) {
                    echo json_encode(['success' => true, 'message' => 'Emergency contact updated successfully']);
                } else {
                    $errorInfo = $stmt->errorInfo();
                    error_log("SQL Error: " . json_encode($errorInfo));
                    echo json_encode(['success' => false, 'message' => 'Failed to update emergency contact']);
                }
                exit;
            }
        } catch (Exception $e) {
            error_log("Error processing emergency contact: " . $e->getMessage());
            echo json_encode(['success' => false, 'message' => 'Error processing emergency contact: ' . $e->getMessage()]);
            exit;
        }
    }
    
    // If we get here, the action was not recognized
    echo json_encode(['success' => false, 'message' => 'Invalid action']);
    exit;
}

// If neither GET nor POST
echo json_encode(['success' => false, 'message' => 'Invalid request method']);
exit;
?>