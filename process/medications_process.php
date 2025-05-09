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

$database = new Database();
$db = $database->getConnection();

// Handle POST request for adding or updating medications
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        // Determine if this is an add or update operation
        $action = $_POST['action'] ?? 'add';
        $isUpdate = ($action === 'update');
        
        // Validate required fields
        $requiredFields = ['med_name', 'dosage', 'frequency', 'start_date', 'time_of_day'];
        foreach ($requiredFields as $field) {
            if (!isset($_POST[$field]) || empty($_POST[$field])) {
                throw new Exception("Missing required field: $field");
            }
        }
        
        // Sanitize and validate input
        $medication_name = htmlspecialchars(trim($_POST['med_name']));
        $dosage = htmlspecialchars(trim($_POST['dosage']));
        $frequency = htmlspecialchars(trim($_POST['frequency']));
        $start_date = $_POST['start_date'];
        $end_date = !empty($_POST['end_date']) ? $_POST['end_date'] : null;
        $time_of_day = $_POST['time_of_day'];
        
        // Validate dates
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $start_date)) {
            throw new Exception("Invalid start date format");
        }
        
        if ($end_date && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $end_date)) {
            throw new Exception("Invalid end date format");
        }
        
        // Handle image upload if present
        $image = null;
        
        if ($isUpdate) {
            // For update, check if we need to replace the image
            $med_id = (int)$_POST['med_id'];
            
            // Verify medication belongs to user
            $stmt = $db->prepare("SELECT id, image FROM medications WHERE id = ? AND auth_id = ?");
            $stmt->execute([$med_id, $auth_id]);
            $medication = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$medication) {
                throw new Exception("Medication not found or you don't have permission to edit it");
            }
            
            // Keep existing image unless replacing
            $image = $medication['image'];
            
            // Check if replacing image
            if (isset($_POST['replace_image']) && $_POST['replace_image'] == '1' && isset($_FILES['med_image']) && $_FILES['med_image']['error'] == 0) {
                // Process new image
                $image = processImageUpload($_FILES['med_image']);
            }
        } else {
            // For new medication, process image if provided
            if (isset($_FILES['med_image']) && $_FILES['med_image']['error'] == 0) {
                $image = processImageUpload($_FILES['med_image']);
            }
        }
        
        // Begin database transaction
        $db->beginTransaction();
        
        if ($isUpdate) {
            // Update existing medication
            $stmt = $db->prepare("
                UPDATE medications 
                SET medication_name = ?, dosage = ?, frequency = ?, start_date = ?, 
                    end_date = ?, time_of_day = ?, image = ?
                WHERE id = ? AND auth_id = ?
            ");
            
            $result = $stmt->execute([
                $medication_name, $dosage, $frequency, $start_date, 
                $end_date, $time_of_day, $image,
                $med_id, $auth_id
            ]);
        } else {
            // Insert new medication
            $stmt = $db->prepare("
                INSERT INTO medications 
                (auth_id, medication_name, dosage, frequency, start_date, end_date, time_of_day, image)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $result = $stmt->execute([
                $auth_id, $medication_name, $dosage, $frequency, 
                $start_date, $end_date, $time_of_day, $image
            ]);
            
            $med_id = $db->lastInsertId();
        }
        
        if (!$result) {
            throw new Exception("Database error: Failed to " . ($isUpdate ? "update" : "add") . " medication");
        }
        
        // Commit transaction
        $db->commit();
        
        echo json_encode([
            'success' => true, 
            'message' => 'Medication ' . ($isUpdate ? 'updated' : 'added') . ' successfully',
            'medication_id' => $med_id
        ]);
        
    } catch (Exception $e) {
        // Rollback transaction on error
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    exit;
}

// GET handler for fetching medications
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $db->prepare("SELECT * FROM medications WHERE auth_id = ? ORDER BY medication_name ASC");
        $stmt->execute([$auth_id]);
        $medications = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Map database column names to expected frontend names
        $mappedMedications = [];
        foreach ($medications as $medication) {
            // Convert image to base64 data URL if it exists
            $imageUrl = null;
            if (!empty($medication['image'])) {
                // Determine image type - default to jpeg if unknown
                $imageType = 'jpeg';
                
                // Convert binary data to base64 data URL
                $imageUrl = 'data:image/' . $imageType . ';base64,' . base64_encode($medication['image']);
            }
            
            $mappedMedications[] = [
                'id' => $medication['id'],
                'med_name' => $medication['medication_name'],
                'dosage' => $medication['dosage'],
                'frequency' => $medication['frequency'],
                'start_date' => $medication['start_date'],
                'end_date' => $medication['end_date'],
                'time_of_day' => $medication['time_of_day'],
                'med_image' => $imageUrl
            ];
        }
        
        echo json_encode(['success' => true, 'medications' => $mappedMedications]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    exit;
}

// Helper function to process image uploads
function processImageUpload($file) {
    // Define allowed file types
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    
    // Validate file type
    if (!in_array($file['type'], $allowedTypes)) {
        throw new Exception("Invalid file type. Only JPG, PNG and GIF are allowed.");
    }
    
    // Validate file size (max 5MB)
    if ($file['size'] > 5 * 1024 * 1024) {
        throw new Exception("File is too large. Maximum size is 5MB.");
    }
    
    // Read the file content directly as binary data
    return file_get_contents($file['tmp_name']);
}
?>